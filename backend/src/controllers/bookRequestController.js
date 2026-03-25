const BookRequest = require('../models/BookRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

const notifyLibrarians = async (message, link) => {
    try {
        const librarians = await User.find({ role: 'librarian', isActive: true });
        if (librarians.length > 0) {
            const notifications = librarians.map(lib => ({
                userId: lib._id,
                title: 'Yêu cầu sách từ Giảng viên',
                message,
                link
            }));
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Error sending notifications to librarians:', error);
    }
};

const notifyLecturer = async (userId, title, message, link) => {
    try {
        await Notification.create({
            userId,
            title,
            message,
            link
        });
    } catch (error) {
        console.error('Error sending notification to lecturer:', error);
    }
};

// @desc    Create a new book request
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
        await notifyLibrarians(`Giảng viên ${lecturerName} vừa yêu cầu bổ sung ${books.length} sách mới.`, '/admin/book-requests');

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

// @desc    Upload an Excel file with list of books
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

        const books = xlData.map(row => ({
            title: row['Tên sách'] || row['Title'] || row['title'],
            major: row['Ngành'] || row['Major'] || row['major'],
            quantity: parseInt(row['Số lượng'] || row['Quantity'] || row['quantity'] || 1, 10),
        })).filter(b => b.title && b.major);

        if (books.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Could not extract any valid book data from the file. Please ensure columns exist like Title, Major, Quantity.',
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
        await notifyLibrarians(`Giảng viên ${lecturerName} vừa upload file Excel yêu cầu bổ sung ${books.length} sách mới.`, '/admin/book-requests');

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

// @desc    Get all book requests
// @route   GET /book-requests
// @access  Private (Admin/Librarian)
exports.getAllRequests = async (req, res) => {
    try {
        const { status } = req.query; // optional filter
        const query = {};
        if (status) query.status = status;

        const requests = await BookRequest.find(query)
            .populate('lecturer', 'name email department phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests,
        });
    } catch (error) {
        console.error('Error fetching all book requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch book requests',
        });
    }
};

// @desc    Approve or reject a book request
// @route   PUT /book-requests/:id/status
// @access  Private (Admin/Librarian)
exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, Approved, or Rejected.',
            });
        }

        const request = await BookRequest.findByIdAndUpdate(
            id,
            { status, note },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Book request not found',
            });
        }

        const message = status === 'Approved'
            ? `Danh sách yêu cầu sách của bạn đã được duyệt!`
            : `Danh sách yêu cầu sách của bạn đã bị từ chối. Lý do: ${note || 'Không có'}`;
        await notifyLecturer(request.lecturer, 'Cập nhật trạng thái yêu cầu sách', message, '/book-requests');

        res.status(200).json({
            success: true,
            message: `Book request marked as ${status}`,
            data: request,
        });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update request status',
        });
    }
};
