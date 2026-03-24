const Fine = require("../models/Fine");
const BorrowRecord = require("../models/BorrowRecord");

// =======================
// GET MY FINES (Student)
// =======================
exports.getMyFines = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all fines for this user, populate borrow + book info
    const fines = await Fine.find({ userId })
      .populate({
        path: "borrowId",
        model: "BorrowRecord",
        populate: {
          path: "bookId",
          model: "Book",
          select: "title author coverImage",
        },
        select: "bookId dueDate returnDate bookCondition status",
      })
      .sort({ _id: -1 })
      .lean();

    // Calculate overdue days for late fines
    const enrichedFines = fines.map((fine) => {
      const borrow = fine.borrowId;
      let daysOverdue = 0;

      if (borrow?.dueDate) {
        const due = new Date(borrow.dueDate);
        const returned = borrow.returnDate ? new Date(borrow.returnDate) : new Date();
        const diffMs = returned - due;
        daysOverdue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        _id: fine._id,
        amount: fine.amount,
        reason: fine.reason,
        status: fine.status,
        orderCode: fine.orderCode,
        daysOverdue,
        book: borrow?.bookId
          ? {
              title: borrow.bookId.title,
              author: borrow.bookId.author,
              coverImage: borrow.bookId.coverImage,
            }
          : null,
        dueDate: borrow?.dueDate || null,
        returnDate: borrow?.returnDate || null,
        bookCondition: borrow?.bookCondition || null,
      };
    });

    // Summary
    const pendingFines = enrichedFines.filter((f) => f.status === "pending");
    const paidFines = enrichedFines.filter((f) => f.status === "paid");
    const totalOutstanding = pendingFines.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = paidFines.reduce((sum, f) => sum + f.amount, 0);

    res.json({
      success: true,
      data: {
        fines: enrichedFines,
        summary: {
          totalOutstanding,
          totalPaid,
          pendingCount: pendingFines.length,
          paidCount: paidFines.length,
        },
      },
    });
  } catch (err) {
    console.error("getMyFines error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================
// GET ALL FINES (Librarian/Admin)
// =======================
exports.getAllFines = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const fines = await Fine.find(filter)
      .populate("userId", "name email studentId")
      .populate({
        path: "borrowId",
        model: "BorrowRecord",
        populate: { path: "bookId", model: "Book", select: "title author" },
      })
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Fine.countDocuments(filter);

    res.json({
      success: true,
      data: { fines, total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};