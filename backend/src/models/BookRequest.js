const mongoose = require('mongoose');

const bookItemSchema = new mongoose.Schema({
    // Core book info (mirrors Book model fields)
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    isbn: { type: String, trim: true },
    publisher: { type: String, trim: true },
    publish_year: { type: Number },
    price: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    categoryName: { type: String, trim: true }, // plain text, not ObjectId
    reason: { type: String, trim: true },       // lý do đề xuất cuốn này

    // Per-book review status (librarian can approve/reject each book independently)
    bookStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    rejectReason: { type: String, trim: true }, // lý do từ chối riêng của cuốn này
}, { _id: false });

const bookRequestSchema = new mongoose.Schema(
    {
        lecturer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        books: [bookItemSchema],
        semester: {
            type: String,
            trim: true,
            default: 'Upcoming',
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected', 'PartiallyApproved'],
            default: 'Pending',
        },
        note: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('BookRequest', bookRequestSchema);
