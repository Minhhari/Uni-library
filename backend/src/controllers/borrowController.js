const BorrowRecord = require("../models/BorrowRecord");
const Book = require("../models/Book");


// Borrow request
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
      bookId
    });

    res.json({
      message: "Borrow request submitted",
      borrow
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get my borrowed books
exports.getMyBooks = async (req, res) => {

  try {

    const records = await BorrowRecord.find({
      userId: req.user.id
    }).populate("bookId");

    res.json(records);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};


// Get all borrow records (librarian)
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


// Approve borrow
exports.approveBorrow = async (req, res) => {

  try {

    const record = await BorrowRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    const book = await Book.findById(record.bookId);

    if (book.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    const borrowDate = new Date();

    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + 70); // 10 weeks = 70 days

    record.status = "approved";
    record.borrowDate = borrowDate;
    record.dueDate = dueDate;

    await record.save();

    book.available -= 1;
    await book.save();

    res.json({
      message: "Borrow approved",
      record
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};


// Reject borrow
exports.rejectBorrow = async (req, res) => {

  try {

    const record = await BorrowRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    record.status = "rejected";

    await record.save();

    res.json({
      message: "Borrow rejected"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};


// Return book
exports.returnBook = async (req, res) => {

  try {

    const record = await BorrowRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (record.status === "returned") {
      return res.status(400).json({
        message: "Book already returned"
      });
    }
    
    const book = await Book.findById(record.bookId);

    const returnDate = new Date();

    record.returnDate = returnDate;
    record.status = "returned";

    // Fine calculation
    if (returnDate > record.dueDate) {

      const lateDays = Math.ceil(
        (returnDate - record.dueDate) / (1000 * 60 * 60 * 24)
      );

      record.fineAmount = lateDays * 5000;
    }

    await record.save();

    book.available += 1;
    await book.save();

    res.json({
      message: "Book returned successfully",
      fine: record.fineAmount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};