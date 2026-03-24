const mongoose = require("mongoose");

const borrowRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true
  },
  borrowDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  returnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "returned"],
    default: "pending"
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  // Tình trạng sách khi trả - do Librarian kiểm tra và cập nhật
  bookCondition: {
    type: String,
    enum: ["good", "damaged", "lost"],
    default: "good"
  }
}, { timestamps: true,
    collection: "borrowRecords"
 });

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);