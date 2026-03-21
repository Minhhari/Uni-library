const BorrowRecord = require("../models/BorrowRecord");
const Book = require("../models/Book");
const Fine = require("../models/Fine");

// =======================
// BORROW REQUEST
// =======================
exports.requestBorrow = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    const book = await Book.findById(bookId);

    if (!book || book.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    const borrow = await BorrowRecord.create({
      userId,
      bookId,
      status: "pending",
    });

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

    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + 70); // 10 tuần

    record.status = "approved";
    record.borrowDate = borrowDate;
    record.dueDate = dueDate;

    await record.save();

    // trừ sách
    book.available -= 1;
    await book.save();

    res.json({
      message: "Borrow approved",
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

    // 🔥 chỉ return khi đã approve
    if (record.status !== "approved") {
      return res.status(400).json({
        message: "Only approved records can be returned",
      });
    }

    const book = await Book.findById(record.bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const returnDate = new Date();

    record.returnDate = returnDate;
    record.status = "returned";

    let fineAmount = 0;

    // =========================
    // CHECK LATE
    // =========================
    if (record.dueDate && returnDate > record.dueDate) {
      const diffTime = returnDate - record.dueDate;

      const daysLate = Math.ceil(
        diffTime / (1000 * 60 * 60 * 24)
      );

      fineAmount = daysLate * 5000;

      record.fineAmount = fineAmount;

      // 🔥 tránh tạo duplicate fine
      const existingFine = await Fine.findOne({
        borrowId: record._id,
      });

      if (!existingFine) {
        await Fine.create({
          userId: record.userId,
          borrowId: record._id,
          amount: fineAmount,
          reason: "late",
          status: "pending",
          paid: false,
        });
      }
    }

    await record.save();

    // cộng lại sách
    book.available += 1;
    await book.save();

    res.json({
      message: "Book returned successfully",
      fine: fineAmount,
    });

  } catch (err) {
    console.error("Return book error:", err);
    res.status(500).json({
      message: "Return book failed",
      error: err.message,
    });
  }
};