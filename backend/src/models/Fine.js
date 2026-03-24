const mongoose = require("mongoose");

const fineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  borrowId: { type: mongoose.Schema.Types.ObjectId, ref: "Borrow" },

  amount: Number,

  reason: {
    type: String,
    enum: ["late", "lost", "damaged", "late_and_damaged", "lost_and_late"]
  },

  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },

  orderCode: Number
});

module.exports = mongoose.model("Fine", fineSchema);