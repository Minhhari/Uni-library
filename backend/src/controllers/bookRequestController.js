const BookRequest = require('../models/BookRequest');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

// @desc    Create a new book request
// @route   POST /book-requests
// @access  Private (Lecturer)
exports.createRequest = async (req, res) => {
    try {
        const { books, semester } = req.body;

        if (!books || !Array.isArray(books) || books.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Phải cung cấp danh sách sách cần yêu cầu.',
            });
        }

        const bookRequest = await BookRequest.create({
            lecturer: req.user._id,
            books,
            semester: semester || 'Upcoming',
            status: 'Pending',
        });

        const lecturerName = req.user.name || req.user.email || 'Một giảng viên';
        await notificationService.notifyLibrarians('Yêu cầu bổ sung sách mới', `Giảng viên ${lecturerName} vừa yêu cầu bổ sung ${books.length} sách mới.`, '/admin/book-requests');

        res.status(201).json({
            success: true,
            message: 'Yêu cầu sách đã được gửi thành công',
            data: bookRequest,
        });
    } catch (error) {
        console.error('Error creating book request:', error);
        res.status(500).json({
            success: false,
            message: 'Gửi yêu cầu sách thất bại',
        });
    }
};

// @desc    Upload an Excel file with list of books
// @route   POST /book-requests/upload
// @access  Private (Lecturer)
exports.uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng tải lên file Excel.' });
        }

        const xlsx = require('xlsx');
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!xlData || xlData.length === 0) {
            return res.status(400).json({ success: false, message: 'File trống hoặc sai định dạng.' });
        }

        const books = xlData.map(row => ({
            title: row['Tên sách'] || row['Title'] || row['title'],
            major: row['Ngành'] || row['Major'] || row['major'],
            quantity: parseInt(row['Số lượng'] || row['Quantity'] || row['quantity'] || 1, 10),
        })).filter(b => b.title && b.major);

        if (books.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể trích xuất dữ liệu sách hợp lệ. Vui lòng đảm bảo file có các cột như: Title/Tên sách, Major/Ngành, Quantity/Số lượng.',
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
        await notificationService.notifyLibrarians('Yêu cầu bổ sung sách mới (Excel)', `Giảng viên ${lecturerName} vừa upload file Excel yêu cầu bổ sung ${books.length} sách mới.`, '/admin/book-requests');

        res.status(201).json({
            success: true,
            message: 'Yêu cầu sách từ file đã được gửi thành công',
            data: bookRequest,
        });
    } catch (error) {
        console.error('Error uploading excel request:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi đọc và lưu yêu cầu sách', error: error.message });
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
            message: 'Không thể tải danh sách yêu cầu của bạn',
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
            message: 'Không thể tải danh sách yêu cầu',
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
                message: 'Trạng thái không hợp lệ. Phải là Pending, Approved, hoặc Rejected.',
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
                message: 'Không tìm thấy yêu cầu sách',
            });
        }

        const message = status === 'Approved'
            ? `Danh sách yêu cầu sách của bạn đã được duyệt!`
            : `Danh sách yêu cầu sách của bạn đã bị từ chối. Lý do: ${note || 'Không có'}`;
        await notificationService.createNotification(request.lecturer, 'Cập nhật trạng thái yêu cầu sách', message, '/book-requests');

        res.status(200).json({
            success: true,
            message: `Trạng thái yêu cầu đã được cập nhật thành ${status}`,
            data: request,
        });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({
            success: false,
            message: 'Cập nhật trạng thái thất bại',
        });
    }
};
