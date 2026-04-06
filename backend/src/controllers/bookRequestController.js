const BookRequest = require('../models/BookRequest');
const Book = require('../models/Book');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

// Helper: annotate books with existingStock by comparing ISBN or title
const annotateWithStock = async (books) => {
    const allBooks = await Book.find({}, 'title isbn quantity').lean();

    return books.map((book) => {
        let existingBook = null;
        if (book.isbn) {
            existingBook = allBooks.find(
                (b) => b.isbn && b.isbn.toLowerCase() === book.isbn.toLowerCase()
            );
        }
        if (!existingBook && book.title) {
            existingBook = allBooks.find(
                (b) => b.title.toLowerCase() === book.title.toLowerCase()
            );
        }
        return {
            ...book,
            existingStock: existingBook ? existingBook.quantity : 0,
        };
    });
};

// @desc    Create a new book request (manual form)
// @route   POST /book-requests
// @access  Private (Lecturer)
exports.createRequest = async (req, res) => {
    try {
        const { books, semester } = req.body;

        if (!books || !Array.isArray(books) || books.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Must provide an array of books to request.',
            });
        }

        const bookRequest = await BookRequest.create({
            lecturer: req.user._id,
            books,
            semester: semester || 'Upcoming',
            status: 'Pending',
        });

        const lecturerName = req.user.name || req.user.email || 'Một giảng viên';
        await notificationService.notifyLibrarians(
            'Yêu cầu bổ sung sách mới',
            `Giảng viên ${lecturerName} vừa yêu cầu bổ sung ${books.length} sách mới.`,
            '/admin/book-requests'
        );

        res.status(201).json({
            success: true,
            message: 'Book request submitted successfully',
            data: bookRequest,
        });
    } catch (error) {
        console.error('Error creating book request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create book request',
        });
    }
};

// @desc    Upload an Excel file with list of books (9-column template)
// @route   POST /book-requests/upload
// @access  Private (Lecturer)
exports.uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an Excel file.' });
        }

        const xlsx = require('xlsx');
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!xlData || xlData.length === 0) {
            return res.status(400).json({ success: false, message: 'File is empty or invalid format.' });
        }

        const books = xlData.map((row) => ({
            title: (row['Tên Sách'] || row['Ten Sach'] || row['Title'] || '').toString().trim(),
            author: (row['Tác Giả'] || row['Tac Gia'] || row['Author'] || '').toString().trim(),
            isbn: (row['Mã ISBN'] || row['Ma ISBN'] || row['ISBN'] || '').toString().trim(),
            publisher: (row['Nhà Xuất Bản'] || row['Nha Xuat Ban'] || row['Publisher'] || '').toString().trim(),
            publish_year: parseInt(row['Năm XB'] || row['Nam XB'] || row['Publish Year'] || 0, 10) || undefined,
            price: parseFloat(row['Giá Tiền Dự Kiến'] || row['Gia Tien Du Kien'] || row['Price'] || 0) || 0,
            quantity: parseInt(row['Số Lượng'] || row['So Luong'] || row['Quantity'] || 1, 10) || 1,
            categoryName: (row['Thể Loại'] || row['The Loai'] || row['Category'] || '').toString().trim(),
            reason: (row['Lý do yêu cầu'] || row['Ly do yeu cau'] || row['Reason'] || '').toString().trim(),
            bookStatus: 'pending',
        })).filter((b) => b.title);

        if (books.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại file và tên cột.',
            });
        }

        const semester = req.body.semester || 'Upcoming';

        const bookRequest = await BookRequest.create({
            lecturer: req.user._id,
            books,
            semester,
            status: 'Pending',
        });

        const lecturerName = req.user.name || req.user.email || 'Một giảng viên';
        await notificationService.notifyLibrarians(
            'Yêu cầu bổ sung sách mới (Excel)',
            `Giảng viên ${lecturerName} vừa upload file Excel yêu cầu bổ sung ${books.length} sách mới.`,
            '/admin/dashboard?tab=requests'
        );

        res.status(201).json({
            success: true,
            message: 'Book request submitted successfully from file',
            data: bookRequest,
        });
    } catch (error) {
        console.error('Error uploading excel request:', error);
        res.status(500).json({ success: false, message: 'Failed to parse and save book request', error: error.message });
    }
};

// @desc    Get all book requests of the current user
// @route   GET /book-requests/my-requests
// @access  Private (Lecturer)
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await BookRequest.find({ lecturer: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests,
        });
    } catch (error) {
        console.error('Error fetching my book requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your book requests',
        });
    }
};

// @desc    Get all book requests (with duplicate-check annotation)
// @route   GET /book-requests
// @access  Private (Admin/Librarian)
exports.getAllRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status) query.status = status;

        const requests = await BookRequest.find(query)
            .populate('lecturer', 'name email department phone')
            .sort({ createdAt: -1 })
            .lean();

        // Annotate each request's books with existingStock
        const annotated = await Promise.all(
            requests.map(async (req) => ({
                ...req,
                books: await annotateWithStock(req.books),
            }))
        );

        res.status(200).json({
            success: true,
            data: annotated,
        });
    } catch (error) {
        console.error('Error fetching all book requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch book requests',
        });
    }
};

// @desc    Update overall request status (Approve all / Reject all)
// @route   PUT /book-requests/:id/status
// @access  Private (Admin/Librarian)
exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        if (!['Pending', 'Approved', 'Rejected', 'PartiallyApproved'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status.',
            });
        }

        const request = await BookRequest.findByIdAndUpdate(
            id,
            { status, note },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: 'Book request not found' });
        }

        const message =
            status === 'Approved'
                ? `Danh sách yêu cầu sách của bạn đã được duyệt!`
                : `Danh sách yêu cầu sách của bạn đã bị từ chối. Lý do: ${note || 'Không có'}`;
        await notificationService.createNotification(
            request.lecturer,
            'Cập nhật trạng thái yêu cầu sách',
            message,
            '/book-requests'
        );

        res.status(200).json({
            success: true,
            message: `Book request marked as ${status}`,
            data: request,
        });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ success: false, message: 'Failed to update request status' });
    }
};

// @desc    Update per-book status (approve or reject a single book item)
// @route   PUT /book-requests/:id/books/:bookIndex/status
// @access  Private (Admin/Librarian)
exports.updateBookItemStatus = async (req, res) => {
    try {
        const { id, bookIndex } = req.params;
        const { bookStatus, rejectReason } = req.body;
        const idx = parseInt(bookIndex, 10);

        if (!['approved', 'rejected'].includes(bookStatus)) {
            return res.status(400).json({ success: false, message: 'bookStatus must be approved or rejected' });
        }

        const request = await BookRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Book request not found' });
        }
        if (idx < 0 || idx >= request.books.length) {
            return res.status(400).json({ success: false, message: 'Invalid book index' });
        }

        request.books[idx].bookStatus = bookStatus;
        if (bookStatus === 'rejected' && rejectReason) {
            request.books[idx].rejectReason = rejectReason;
        } else {
            request.books[idx].rejectReason = undefined;
        }

        // Recompute overall status
        const statuses = request.books.map((b) => b.bookStatus);
        const allApproved = statuses.every((s) => s === 'approved');
        const allRejected = statuses.every((s) => s === 'rejected');
        const anyPending = statuses.some((s) => s === 'pending');

        if (anyPending) {
            request.status = 'Pending';
        } else if (allApproved) {
            request.status = 'Approved';
        } else if (allRejected) {
            request.status = 'Rejected';
        } else {
            request.status = 'PartiallyApproved';
        }

        await request.save();

        res.status(200).json({
            success: true,
            message: `Book item ${bookStatus}`,
            data: request,
        });
    } catch (error) {
        console.error('Error updating book item status:', error);
        res.status(500).json({ success: false, message: 'Failed to update book item status' });
    }
};
