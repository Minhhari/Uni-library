const BorrowRecord = require("../models/BorrowRecord");
const Book = require("../models/Book");
const Fine = require("../models/Fine");
const notificationService = require("../services/notificationService");

// =======================
// BORROW REQUEST
// =======================
exports.requestBorrow = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has accepted terms (students/lecturers only)
    if (['student', 'lecturer'].includes(userRole) && !req.user.hasAcceptedTerms) {
      return res.status(403).json({ 
        message: "You must accept the Terms & Policies before borrowing books." 
      });
    }

    const book = await Book.findById(bookId);

    if (!book || book.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    const borrow = await BorrowRecord.create({
      userId,
      bookId,
      status: "pending",
    });

    // Thông báo cho Librarian khi có yêu cầu mượn sách mới
    const borrowerName = req.user.name || req.user.email || 'Người dùng';
    await notificationService.notifyLibrarians(
      'Yêu cầu mượn sách mới',
      `${borrowerName} (${userRole}) vừa gửi yêu cầu mượn sách "${book.title}".`,
      '/admin'
    );

    res.json({
      message: "Borrow request submitted",
      borrow,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// GET MY BOOKS
// =======================
exports.getMyBooks = async (req, res) => {
  try {
    const records = await BorrowRecord.find({
      userId: req.user.id,
    }).populate("bookId");

    res.json(records);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// GET ALL BORROWS (ADMIN/LIBRARIAN)
// =======================
exports.getAllBorrows = async (req, res) => {
  try {
    const records = await BorrowRecord.find()
      .populate("userId")
      .populate("bookId");

    res.json(records);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// APPROVE BORROW
// =======================
exports.approveBorrow = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    // 🔥 chỉ approve khi pending
    if (record.status !== "pending") {
      return res.status(400).json({
        message: "Only pending requests can be approved",
      });
    }

    const book = await Book.findById(record.bookId);

    if (!book || book.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    const borrowDate = new Date();
    const pickupDeadline = new Date();
    pickupDeadline.setDate(pickupDeadline.getDate() + 3); // 3 ngày để lấy sách

    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + 70); // 10 tuần sau khi mượn

    // 🔥 Chuyển sang waiting_for_pickup và trừ sách ngay
    record.status = "waiting_for_pickup";
    record.borrowDate = null; // Chưa set, chỉ set khi thực sự mượn
    record.dueDate = dueDate; // Set trước due date
    record.pickupDeadline = pickupDeadline;

    await record.save();

    // ✅ TRỪ SÁCH NGAY KHI DUYỆT
    book.available -= 1;
    await book.save();

    await notificationService.createNotification(
      record.userId,
      "Yêu cầu mượn sách đã được duyệt",
      `Sách "${book.title}" đã được giữ cho bạn. Vui lòng đến nhận trước ngày ${pickupDeadline.toLocaleDateString()}.`,
      "/my-activity"
    );

    res.json({
      message: "Borrow approved",
      record,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// PICKUP BOOK (LIBRARIAN GIAO SÁCH)
// =======================
exports.pickupBook = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (record.status !== "waiting_for_pickup") {
      return res.status(400).json({
        message: "Only requests waiting for pickup can be picked up",
      });
    }

    record.status = "approved"; // Representing 'borrowed' in UI
    record.borrowDate = new Date();

    await record.save();

    await notificationService.createNotification(
      record.userId,
      "Xác nhận nhận sách",
      `Bạn đã nhận mượn sách thành công. Hạn trả là ${record.dueDate.toLocaleDateString('vi-VN')}.`,
      "/my-activity"
    );

    res.json({
      message: "Book picked up successfully",
      record,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// REJECT BORROW
// =======================
exports.rejectBorrow = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (record.status !== "pending") {
      return res.status(400).json({
        message: "Only pending requests can be rejected",
      });
    }

    record.status = "rejected";

    await record.save();

    // Gửi thông báo cho sinh viên
    await notificationService.createNotification(
      record.userId,
      "Yêu cầu mượn sách bị từ chối",
      "Yêu cầu mượn sách của bạn đã bị từ chối bởi thủ thư.",
      "/my-activity"
    );

    res.json({
      message: "Borrow rejected",
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// RETURN BOOK
// =======================
exports.returnBook = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (record.status === "returned") {
      return res.status(400).json({
        message: "Book already returned",
      });
    }

    // chỉ return khi đã approve
    if (record.status !== "approved") {
      return res.status(400).json({
        message: "Only approved records can be returned",
      });
    }

    const book = await Book.findById(record.bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // bookCondition do Librarian truyền lên: "good" | "damaged" | "lost"
    // Mặc định là "good" nếu không truyền
    const bookCondition = req.body.bookCondition || "good";

    if (!["good", "damaged", "lost"].includes(bookCondition)) {
      return res.status(400).json({
        message: "bookCondition must be one of: good, damaged, lost",
      });
    }

    const returnDate = new Date();
    record.returnDate = returnDate;
    record.status = "returned";
    record.bookCondition = bookCondition;

    // =========================
    // TÍNH TIỀN PHẠT
    // =========================
    const bookPrice = book.price || 0;
    const isLost = bookCondition === "lost";
    const isDamaged = bookCondition === "damaged";

    let isLate = false;
    let daysLate = 0;
    if (record.dueDate && returnDate > record.dueDate) {
      isLate = true;
      const diffTime = returnDate - record.dueDate;
      daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    let fineAmount = 0;
    let fineReason = null;

    if (isLost && isLate) {
      // Mất sách + quá hạn: 100% giá sách + 5000/ngày trễ
      fineAmount = bookPrice + daysLate * 5000;
      fineReason = "lost_and_late";
    } else if (isLost) {
      // Mất sách đúng hạn: 100% giá sách
      fineAmount = bookPrice;
      fineReason = "lost";
    } else if (isDamaged && isLate) {
      // Hư hỏng + quá hạn: 50% giá sách + 5000/ngày trễ
      fineAmount = bookPrice * 0.5 + daysLate * 5000;
      fineReason = "late_and_damaged";
    } else if (isDamaged) {
      // Hư hỏng đúng hạn: 50% giá sách
      fineAmount = bookPrice * 0.5;
      fineReason = "damaged";
    } else if (isLate) {
      // Nguyên vẹn + quá hạn: 5000/ngày trễ
      fineAmount = daysLate * 5000;
      fineReason = "late";
    }
    // Nguyên vẹn + đúng hạn: không phạt (fineAmount = 0)

    record.fineAmount = fineAmount;
    await record.save();

    // Tạo Fine record nếu có phạt
    if (fineAmount > 0) {
      const existingFine = await Fine.findOne({ borrowId: record._id });
      if (!existingFine) {
        await Fine.create({
          userId: record.userId,
          borrowId: record._id,
          amount: fineAmount,
          reason: fineReason,
          status: "pending",
        });
      }
    }

    // Cập nhật trạng thái sách & Cộng lại số lượng sách 
    if (isLost) {
      book.status = "lost";
      // Không tăng available vì sách đã mất
    } else if (isDamaged) {
      book.status = "maintenance";
      // Không tăng available vì cần sửa chữa
    } else {
      book.available += 1;
    }
    await book.save();

    // Gửi thông báo về việc trả sách & phạt nếu có
    let notificationMessage = `Bạn đã trả sách "${book.title}" thành công.`;
    if (fineAmount > 0) {
      notificationMessage += ` Phát sinh phí phạt: ${fineAmount.toLocaleString()}đ do ${fineReason}. Vui lòng thanh toán sớm.`;
    }
    await notificationService.createNotification(
      record.userId,
      fineAmount > 0 ? "Thông báo trả sách & Phí phạt" : "Thông báo trả sách",
      notificationMessage,
      fineAmount > 0 ? "/profile?tab=fines" : "/my-activity"
    );

    res.json({
      message: "Book returned successfully",
      bookCondition,
      isLate,
      daysLate,
      fineAmount,
      fineReason,
    });

  } catch (err) {
    console.error("Return book error:", err);
    res.status(500).json({
      message: "Return book failed",
      error: err.message,
    });
  }
};