/**
 * Reservation Queue Service
 * ─────────────────────────────────────────────────────────────────────────
 * Quản lý hàng đợi đặt sách (FIFO).
 * Khi sách được trả lại (available tăng), gọi processQueue() để tự động
 * chuyển reservation "pending" lâu nhất sang "approved".
 *
 * Tích hợp:
 *   const { processQueue } = require('../services/reservationQueue');
 *   await processQueue(bookId);   // gọi sau khi cập nhật book.available
 * ─────────────────────────────────────────────────────────────────────────
 */

const Reservation = require('../models/Reservation');
const Book = require('../models/Book');

// Ngưỡng "sách còn ít" → cho phép đặt chỗ
const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || '3', 10);

// Số ngày user có để tới lấy sách sau khi được approve
const EXPIRE_DAYS = parseInt(process.env.RESERVATION_EXPIRE_DAYS || '3', 10);

/**
 * Kiểm tra xem user có thể đặt chỗ cuốn sách này không.
 * Điều kiện: book.available <= LOW_STOCK_THRESHOLD
 *
 * @param {string} bookId
 * @returns {{ allowed: boolean, book: object, message?: string }}
 */
const canReserve = async (bookId) => {
  const book = await Book.findById(bookId);
  if (!book) return { allowed: false, book: null, message: 'Book not found.' };

  if (book.available > LOW_STOCK_THRESHOLD) {
    return {
      allowed: false,
      book,
      message: `Reservation chỉ khả dụng khi sách còn ≤ ${LOW_STOCK_THRESHOLD} cuốn. Hiện tại còn ${book.available} cuốn – hãy mượn trực tiếp.`,
    };
  }

  return { allowed: true, book };
};

/**
 * Lấy vị trí queue tiếp theo cho một cuốn sách.
 * @param {string} bookId
 * @returns {number}
 */
const getNextQueuePosition = async (bookId) => {
  const last = await Reservation.findOne(
    { bookId, status: 'pending' },
    { queuePosition: 1 },
    { sort: { queuePosition: -1 } }
  );
  return last ? last.queuePosition + 1 : 1;
};

/**
 * Xử lý queue khi có sách trả về (available > 0).
 * Tự động approve reservation "pending" lâu nhất (FIFO theo reservationDate).
 *
 * @param {string|mongoose.Types.ObjectId} bookId
 * @returns {object|null} Reservation vừa được approve, hoặc null nếu không có
 */
const processQueue = async (bookId) => {
  const book = await Book.findById(bookId);
  if (!book || book.available <= 0) return null;

  // Lấy reservation pending lâu nhất (FIFO)
  const nextReservation = await Reservation.findOne(
    { bookId, status: 'pending' },
    null,
    { sort: { queuePosition: 1, reservationDate: 1 } }
  );

  if (!nextReservation) return null;

  // Tính thời hạn lấy sách
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRE_DAYS);

  // Approve reservation
  nextReservation.status = 'approved';
  nextReservation.expiresAt = expiresAt;
  nextReservation.adminNote = `Auto-approved by queue system. Please pick up by ${expiresAt.toDateString()}.`;
  await nextReservation.save();

  // Giảm available
  book.available = Math.max(0, book.available - 1);
  await book.save();

  console.log(
    `[ReservationQueue] Auto-approved reservation ${nextReservation._id} for book "${book.title}" → user ${nextReservation.userId}`
  );

  return nextReservation;
};

/**
 * Chạy queue nhiều lần nếu có nhiều sách trả về cùng lúc.
 * @param {string} bookId
 * @param {number} returnedCount  Số lượng sách được trả về
 */
const processQueueBatch = async (bookId, returnedCount = 1) => {
  const results = [];
  for (let i = 0; i < returnedCount; i++) {
    const approved = await processQueue(bookId);
    if (!approved) break;
    results.push(approved);
  }
  return results;
};

module.exports = {
  canReserve,
  processQueue,
  processQueueBatch,
  getNextQueuePosition,
  LOW_STOCK_THRESHOLD,
};
