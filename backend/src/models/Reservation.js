const mongoose = require('mongoose');

/**
 * Reservation Model
 * Dùng để đặt chỗ sách khi số lượng còn ít (available <= threshold)
 * Khi sách được trả lại, hệ thống sẽ tự động duyệt reservation theo thứ tự queue (FIFO)
 */
const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'bookId is required'],
    },
    reservationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'fulfilled'],
      default: 'pending',
    },
    // Thứ tự trong queue (nhỏ hơn = ưu tiên hơn)
    queuePosition: {
      type: Number,
      default: 0,
    },
    // Ghi chú từ admin/librarian khi approve/reject
    adminNote: {
      type: String,
      default: '',
    },
    // Thời hạn để user tới lấy sách sau khi được approve
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'reservations',
  }
);

// Index để tìm nhanh reservation theo user và book
reservationSchema.index({ userId: 1, bookId: 1 });
reservationSchema.index({ bookId: 1, status: 1, reservationDate: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
