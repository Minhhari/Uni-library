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

    // Per-book review status
    // pending         → chờ thủ thư duyệt
    // pending_import  → đã duyệt, chờ sách về & nhập kho
    // imported        → đã nhập kho thành công (Book record created/updated)
    // rejected        → bị từ chối
    bookStatus: {
        type: String,
        enum: ['pending', 'pending_import', 'imported', 'rejected'],
        default: 'pending',
    },
    rejectReason: { type: String, trim: true },

    // Thông tin bổ sung khi thủ thư nhập kho (điền lúc sách vật lý về)
    importData: {
        price: { type: Number },          // giá thực tế trên hóa đơn
        location: { type: String, trim: true },    // vị trí kệ sách
        cover_image: { type: String, trim: true }, // URL ảnh bìa
        importedAt: { type: Date },       // timestamp nhập kho
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }, // ref đến Book được tạo/update
        action: { type: String, enum: ['created', 'updated'] }, // nhánh A hay nhánh B
    },
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
            enum: ['Pending', 'Approved', 'Rejected', 'PartiallyApproved', 'Completed'],
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
