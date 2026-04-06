const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const bookRequestController = require('../controllers/bookRequestController');
const {
    createRequest,
    getMyRequests,
    getAllRequests,
    updateRequestStatus,
    updateBookItemStatus,
} = bookRequestController;

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// All endpoints require login
router.use(protect);

// Lecturer endpoints
router.post('/', authorize('lecturer', 'admin', 'librarian'), createRequest);
router.post('/upload', authorize('lecturer', 'admin', 'librarian'), upload.single('file'), bookRequestController.uploadExcel);
router.get('/my-requests', authorize('lecturer', 'admin', 'librarian'), getMyRequests);

// Librarian/Admin endpoints
router.get('/', authorize('admin', 'librarian'), getAllRequests);
router.put('/:id/status', authorize('admin', 'librarian'), updateRequestStatus);
router.put('/:id/books/:bookIndex/status', authorize('admin', 'librarian'), updateBookItemStatus);

module.exports = router;
