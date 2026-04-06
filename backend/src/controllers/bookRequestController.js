const BookRequest = require('../models/BookRequest');
const Book = require('../models/Book');
const Category = require('../models/Category');
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

        if (!['Pending', 'Approved', 'Rejected', 'PartiallyApproved', 'Completed'].includes(status)) {
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

// @desc    Update per-book status (approve → pending_import | reject)
// @route   PUT /book-requests/:id/books/:bookIndex/status
// @access  Private (Admin/Librarian)
exports.updateBookItemStatus = async (req, res) => {
    try {
        const { id, bookIndex } = req.params;
        const { bookStatus, rejectReason } = req.body;
        const idx = parseInt(bookIndex, 10);

        if (!['pending_import', 'rejected'].includes(bookStatus)) {
            return res.status(400).json({ success: false, message: 'bookStatus must be pending_import or rejected' });
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
        const allDone = statuses.every((s) => s === 'imported' || s === 'rejected');
        const allRejected = statuses.every((s) => s === 'rejected');
        const anyPending = statuses.some((s) => s === 'pending');
        const anyPendingImport = statuses.some((s) => s === 'pending_import');

        if (anyPending) {
            request.status = 'Pending';
        } else if (allDone) {
            request.status = allRejected ? 'Rejected' : 'Completed';
        } else if (anyPendingImport) {
            // Some approved (pending_import), others may be rejected
            const hasRejected = statuses.some((s) => s === 'rejected');
            request.status = hasRejected ? 'PartiallyApproved' : 'Approved';
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

// @desc    Nhập kho một cuốn sách (khi hàng về tay)
// @route   POST /book-requests/:id/books/:bookIndex/import
// @access  Private (Admin/Librarian)
// Helper: normalize location to 'Kệ XN' format for LibraryMap compatibility
const normalizeLocation = (loc) => {
    if (!loc) return '';
    const clean = loc.trim().toUpperCase().replace(/K[ÊE]\s*/gi, '').trim();
    const match = clean.match(/^([A-G])(\d+)$/);
    if (match) return `Kệ ${match[1]}${match[2]}`;
    return loc.trim(); // fallback: keep as-is
};

exports.importBook = async (req, res) => {
    try {
        const { id, bookIndex } = req.params;
        const { price, location, cover_image } = req.body;
        const idx = parseInt(bookIndex, 10);

        // Validate required import fields
        if (price === undefined || price === null || price === '') {
            return res.status(400).json({ success: false, message: 'Giá tiền là bắt buộc.' });
        }
        if (!location || !location.trim()) {
            return res.status(400).json({ success: false, message: 'Vị trí kệ sách là bắt buộc.' });
        }

        const normalizedLocation = normalizeLocation(location);

        const request = await BookRequest.findById(id).populate('lecturer', 'name email _id');
        if (!request) {
            return res.status(404).json({ success: false, message: 'Book request not found' });
        }
        if (idx < 0 || idx >= request.books.length) {
            return res.status(400).json({ success: false, message: 'Invalid book index' });
        }

        const bookItem = request.books[idx];
        if (bookItem.bookStatus !== 'pending_import') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể nhập kho sách đang ở trạng thái chờ nhập kho.',
            });
        }

        const importedPrice = parseFloat(price) || 0;
        const importedAt = new Date();

        // ── Resolve category ──────────────────────────────────────────────────
        let categoryId = null;
        if (bookItem.categoryName) {
            let cat = await Category.findOne({ name: { $regex: new RegExp(`^${bookItem.categoryName}$`, 'i') } });
            if (!cat) {
                const code = bookItem.categoryName.toUpperCase().replace(/\s+/g, '_');
                cat = await Category.create({ name: bookItem.categoryName, code });
            }
            categoryId = cat._id;
        }

        let bookDoc = null;
        let action = 'created';

        // ── Nhánh A / Nhánh B: kiểm tra ISBN trùng ───────────────────────────
        if (bookItem.isbn) {
            bookDoc = await Book.findOne({ isbn: bookItem.isbn });
        }

        if (bookDoc) {
            // ── Nhánh B: Sách đã tồn tại — cộng dồn số lượng ────────────────
            bookDoc.quantity += bookItem.quantity;
            bookDoc.available += bookItem.quantity;
            // Cập nhật giá nếu đợt này khác
            if (importedPrice > 0) bookDoc.price = importedPrice;
            // Cập nhật ảnh bìa nếu thủ thư upload
            if (cover_image) bookDoc.cover_image = cover_image;
            await bookDoc.save();
            action = 'updated';
        } else {
            // ── Nhánh A: Sách mới — tạo mới trong bảng Book ──────────────────
            const newBookData = {
                title: bookItem.title,
                author: bookItem.author || 'Chưa xác định',
                isbn: bookItem.isbn || `AUTO-${Date.now()}`,
                publisher: bookItem.publisher || 'Chưa xác định',
                publish_year: bookItem.publish_year || new Date().getFullYear(),
                quantity: bookItem.quantity,
                available: bookItem.quantity,
                price: importedPrice,
                location: normalizedLocation,
                cover_image: cover_image || '',
                status: 'available',
            };
            if (categoryId) newBookData.category = categoryId;
            bookDoc = await Book.create(newBookData);
        }

        // Cập nhật location trên Book doc (cho cả nhánh B)
        if (action === 'updated' && normalizedLocation) {
            await Book.findByIdAndUpdate(bookDoc._id, { location: normalizedLocation });
        }

        // ── Cập nhật bookItem trong request ──────────────────────────────────
        request.books[idx].bookStatus = 'imported';
        request.books[idx].importData = {
            price: importedPrice,
            location: normalizedLocation,
            cover_image: cover_image || '',
            importedAt,
            bookId: bookDoc._id,
            action,
        };

        // ── Recompute overall request status ─────────────────────────────────
        const statuses = request.books.map((b) => b.bookStatus);
        const allDone = statuses.every((s) => s === 'imported' || s === 'rejected');
        const allRejected = statuses.every((s) => s === 'rejected');

        if (allDone) {
            request.status = allRejected ? 'Rejected' : 'Completed';
        } else {
            const hasImported = statuses.some((s) => s === 'imported');
            request.status = hasImported ? 'PartiallyApproved' : 'Approved';
        }

        await request.save();

        // ── Thông báo cho Giảng viên ──────────────────────────────────────────
        const lecturerId = request.lecturer?._id || request.lecturer;
        const bookTitle = bookItem.title;
        await notificationService.createNotification(
            lecturerId,
            '📦 Sách đã nhập kho thành công',
            `Sách "${bookTitle}" thầy/cô yêu cầu đã được nhập kho và sẵn sàng tại ${location.trim()}.`,
            '/book-requests'
        );

        res.status(200).json({
            success: true,
            message: `Nhập kho thành công. Sách đã được ${action === 'created' ? 'tạo mới' : 'cập nhật số lượng'}.`,
            data: {
                request,
                book: bookDoc,
                action,
            },
        });
    } catch (error) {
        console.error('Error importing book:', error);
        res.status(500).json({ success: false, message: 'Nhập kho thất bại.', error: error.message });
    }
};

// @desc    Bulk import nhiều sách từ file Excel (nhập kho hàng loạt)
// @route   POST /book-requests/bulk-import
// @access  Private (Admin/Librarian)
exports.bulkImportBooks = async (req, res) => {
    try {
        const { items } = req.body;
        // items: [{ requestId, bookIndex, price, location }]

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách items không hợp lệ.' });
        }

        const results = [];
        const failures = [];

        for (const item of items) {
            const { requestId, bookIndex, price, location } = item;
            const idx = parseInt(bookIndex, 10);

            try {
                if (!requestId || isNaN(idx) || price === undefined || !location?.trim()) {
                    failures.push({ requestId, bookIndex, reason: 'Thiếu thông tin bắt buộc (giá, vị trí).' });
                    continue;
                }

                const normalizedLocation = normalizeLocation(location);

                const request = await BookRequest.findById(requestId).populate('lecturer', 'name email _id');
                if (!request || idx < 0 || idx >= request.books.length) {
                    failures.push({ requestId, bookIndex, reason: 'Không tìm thấy yêu cầu hoặc chỉ mục không hợp lệ.' });
                    continue;
                }

                const bookItem = request.books[idx];
                if (bookItem.bookStatus !== 'pending_import') {
                    failures.push({ requestId, bookIndex, title: bookItem.title, reason: 'Sách không ở trạng thái chờ nhập kho.' });
                    continue;
                }

                const importedPrice = parseFloat(price) || 0;
                const importedAt = new Date();

                // Auto cover_image từ Open Library theo ISBN
                let cover_image = '';
                if (bookItem.isbn) {
                    cover_image = `https://covers.openlibrary.org/b/isbn/${bookItem.isbn}-L.jpg`;
                }

                // Resolve category
                let categoryId = null;
                if (bookItem.categoryName) {
                    let cat = await Category.findOne({ name: { $regex: new RegExp(`^${bookItem.categoryName}$`, 'i') } });
                    if (!cat) {
                        const code = bookItem.categoryName.toUpperCase().replace(/\s+/g, '_');
                        cat = await Category.create({ name: bookItem.categoryName, code });
                    }
                    categoryId = cat._id;
                }

                let bookDoc = null;
                let action = 'created';

                if (bookItem.isbn) {
                    bookDoc = await Book.findOne({ isbn: bookItem.isbn });
                }

                if (bookDoc) {
                    bookDoc.quantity += bookItem.quantity;
                    bookDoc.available += bookItem.quantity;
                    if (importedPrice > 0) bookDoc.price = importedPrice;
                    if (cover_image) bookDoc.cover_image = cover_image;
                    bookDoc.location = normalizedLocation;
                    await bookDoc.save();
                    action = 'updated';
                } else {
                    const newBookData = {
                        title: bookItem.title,
                        author: bookItem.author || 'Chưa xác định',
                        isbn: bookItem.isbn || `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        publisher: bookItem.publisher || 'Chưa xác định',
                        publish_year: bookItem.publish_year || new Date().getFullYear(),
                        quantity: bookItem.quantity,
                        available: bookItem.quantity,
                        price: importedPrice,
                        location: normalizedLocation,
                        cover_image,
                        status: 'available',
                    };
                    if (categoryId) newBookData.category = categoryId;
                    bookDoc = await Book.create(newBookData);
                }

                request.books[idx].bookStatus = 'imported';
                request.books[idx].importData = {
                    price: importedPrice,
                    location: normalizedLocation,
                    cover_image,
                    importedAt,
                    bookId: bookDoc._id,
                    action,
                };

                // Recompute request status
                const statuses = request.books.map((b) => b.bookStatus);
                const allDone = statuses.every((s) => s === 'imported' || s === 'rejected');
                const allRejected = statuses.every((s) => s === 'rejected');
                if (allDone) {
                    request.status = allRejected ? 'Rejected' : 'Completed';
                } else {
                    const hasImported = statuses.some((s) => s === 'imported');
                    request.status = hasImported ? 'PartiallyApproved' : 'Approved';
                }

                await request.save();

                try {
                    const lecturerId = request.lecturer?._id || request.lecturer;
                    await notificationService.createNotification(
                        lecturerId,
                        'Sách đã nhập kho thành công',
                        `Sách "${bookItem.title}" đã được nhập kho và sẵn sàng tại ${location.trim()}.`,
                        '/book-requests'
                    );
                } catch (_) { /* Non-critical */ }

                results.push({ requestId, bookIndex: idx, title: bookItem.title, action });
            } catch (itemErr) {
                failures.push({ requestId, bookIndex, reason: itemErr.message });
            }
        }

        res.status(200).json({
            success: true,
            message: `Nhập kho hàng loạt: ${results.length} thành công, ${failures.length} thất bại.`,
            data: { imported: results.length, failed: failures.length, results, failures },
        });
    } catch (error) {
        console.error('Error bulk importing books:', error);
        res.status(500).json({ success: false, message: 'Nhập kho hàng loạt thất bại.', error: error.message });
    }
};
