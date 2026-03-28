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
    enum: ["pending", "waiting_for_pickup", "approved", "rejected", "returned", "expired"],
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
  },
  pickupDeadline: {
    type: Date
  },
  // Flag: record này được tạo từ Reservation (đặt trước)
  fromReservation: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: "borrowRecords"
});

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);