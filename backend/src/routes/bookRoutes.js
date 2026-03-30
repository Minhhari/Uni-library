const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateBookQuantity,
  getCategories
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Validation rules
const bookValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('isbn').notEmpty().withMessage('ISBN is required'),
  body('publisher').notEmpty().withMessage('Publisher is required'),
  body('publish_year').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Valid publish year is required'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
];

const updateBookValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().notEmpty().withMessage('Author cannot be empty'),
  body('category').optional().isMongoId().withMessage('Valid category ID is required'),
  body('isbn').optional().notEmpty().withMessage('ISBN cannot be empty'),
  body('publisher').optional().notEmpty().withMessage('Publisher cannot be empty'),
  body('publish_year').optional().isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Valid publish year is required'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('status').optional().isIn(['available', 'unavailable', 'maintenance']).withMessage('Invalid status')
];

// Public routes
router.get('/', getBooks);
router.get('/categories', getCategories);
router.get('/details/:id', getBookById);
router.get('/:id', getBookById);

// Protected routes - Admin and Librarian only
router.post('/', protect, authorize('admin', 'librarian'), bookValidation, createBook);
router.put('/:id', protect, authorize('admin', 'librarian'), updateBookValidation, updateBook);
router.put('/:id/quantity', protect, authorize('admin', 'librarian'), updateBookQuantity);

// Admin only route
router.delete('/:id', protect, authorize('admin'), deleteBook);

module.exports = router;