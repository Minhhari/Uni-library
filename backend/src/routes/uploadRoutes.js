const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware'); // Notice it's 'middleware' without 's' based on previous findings

// @desc    Upload image(s) to Cloudinary
// @route   POST /api/upload
// @access  Private (Admin, Librarian)

// Single file upload (e.g. cover_image)
router.post('/single', protect, authorize('admin', 'librarian'), upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        res.status(200).json({
            success: true,
            data: req.file.path // Cloudinary URL
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during upload', error: error.message });
    }
});

// Multiple file upload (e.g. previewImages)
router.post('/multiple', protect, authorize('admin', 'librarian'), upload.array('images', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const urls = req.files.map(file => file.path);

        res.status(200).json({
            success: true,
            data: urls // Array of Cloudinary URLs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during upload', error: error.message });
    }
});

module.exports = router;
