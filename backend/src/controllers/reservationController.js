const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const notificationService = require('../services/notificationService');
const {
  canReserve,
  processQueueBatch,
  getNextQueuePosition,
  LOW_STOCK_THRESHOLD,
} = require('../services/reservationQueue');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reservation
// Tạo reservation – chỉ khi sách còn ít (available <= LOW_STOCK_THRESHOLD)
// ─────────────────────────────────────────────────────────────────────────────
const createReservation = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user._id;

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'bookId is required.' });
    }

    // Kiểm tra điều kiện sách còn ít
    const { allowed, book, message } = await canReserve(bookId);
    if (!allowed) {
      return res.status(400).json({ success: false, message });
    }

    // Không cho phép đặt chỗ 2 lần cùng 1 cuốn sách
    const existing = await Reservation.findOne({
      userId,
      bookId,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Bạn đã có reservation ${existing.status} cho cuốn sách này.`,
      });
    }

    const queuePosition = await getNextQueuePosition(bookId);

    const reservation = await Reservation.create({
      userId,
      bookId,
      reservationDate: new Date(),
      status: 'pending',
      queuePosition,
    });

    await reservation.populate([
      { path: 'userId', select: 'fullName email' },
      { path: 'bookId', select: 'title author available' },
    ]);

    return res.status(201).json({
      success: true,
      message: `Đặt chỗ thành công! Vị trí trong hàng đợi: #${queuePosition}. Tổng sách còn lại: ${book.available}.`,
      data: reservation,
    });
  } catch (error) {
    console.error('[createReservation]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reservation/my
// Xem reservations của chính user đang đăng nhập
// ─────────────────────────────────────────────────────────────────────────────
const getMyReservations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Reservation.countDocuments(filter);

    const reservations = await Reservation.find(filter)
      .populate('bookId', 'title author isbn category available')
      .sort({ reservationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: reservations,
    });
  } catch (error) {
    console.error('[getMyReservations]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reservation/all
// Admin/Librarian xem tất cả reservations (có filter & phân trang)
// ─────────────────────────────────────────────────────────────────────────────
const getAllReservations = async (req, res) => {
  try {
    const { status, bookId, userId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (bookId) filter.bookId = bookId;
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Reservation.countDocuments(filter);

    const reservations = await Reservation.find(filter)
      .populate('userId', 'name email studentId')
      .populate('bookId', 'title author isbn available')
      .sort({ status: 1, queuePosition: 1, reservationDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      data: reservations,
    });
  } catch (error) {
    console.error('[getAllReservations]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/reservation/approve/:id
// Admin/Librarian duyệt một reservation thủ công
// ─────────────────────────────────────────────────────────────────────────────
const approveReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Không thể approve reservation ở trạng thái "${reservation.status}".`,
      });
    }

    // Kiểm tra sách còn available không
    const book = await Book.findById(reservation.bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }
    if (book.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã hết, không thể approve ngay lúc này.',
      });
    }

    // Tính thời hạn lấy sách (3 ngày)
    const expireDays = parseInt(process.env.RESERVATION_EXPIRE_DAYS || '3', 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expireDays);

    reservation.status = 'approved';
    reservation.expiresAt = expiresAt;
    reservation.adminNote = req.body.note || `Approved by ${req.user.fullName || req.user.email}.`;
    await reservation.save();

    // Giảm available của sách
    book.available = Math.max(0, book.available - 1);
    await book.save();

    await reservation.populate([
      { path: 'userId', select: 'fullName email' },
      { path: 'bookId', select: 'title author available' },
    ]);

    // Gửi thông báo cho user
    await notificationService.createNotification(
      reservation.userId,
      'Sách đặt chỗ đã được duyệt!',
      `Sách "${reservation.bookId.title}" bạn đặt chỗ đã được phê duyệt thủ công. Vui lòng lấy trước ngày ${expiresAt.toLocaleDateString()}.`,
      '/my-activity'
    );

    return res.json({
      success: true,
      message: 'Reservation đã được duyệt.',
      data: reservation,
    });
  } catch (error) {
    console.error('[approveReservation]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/reservation/reject/:id
// Admin/Librarian từ chối một reservation
// ─────────────────────────────────────────────────────────────────────────────
const rejectReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Không thể reject reservation ở trạng thái "${reservation.status}".`,
      });
    }

    reservation.status = 'rejected';
    reservation.adminNote = req.body.note || `Rejected by ${req.user.fullName || req.user.email}.`;
    await reservation.save();

    // Sau khi reject, thử auto-process queue nếu sách có sẵn
    await processQueueBatch(reservation.bookId, 1);

    await reservation.populate([
      { path: 'userId', select: 'fullName email' },
      { path: 'bookId', select: 'title author available' },
    ]);

    // Gửi thông báo cho user
    await notificationService.createNotification(
      reservation.userId,
      'Yêu cầu đặt sách bị từ chối',
      `Yêu cầu đặt sách "${reservation.bookId.title}" đã bị từ chối. Lý do: ${reservation.adminNote}`,
      '/my-activity'
    );

    return res.json({
      success: true,
      message: 'Reservation đã bị từ chối.',
      data: reservation,
    });
  } catch (error) {
    console.error('[rejectReservation]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  approveReservation,
  rejectReservation,
};
