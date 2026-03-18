const express = require('express');
const router = express.Router();
const {
  getCategoryRecommendations,
  getTrendingByCategory,
  getMultiCategoryRecommendations,
  getAvailableCategories
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

// @route   GET /api/recommendations/category/:categoryId
// @desc    Get recommendations based on category
// @access  Public
router.get('/category/:categoryId', getCategoryRecommendations);

// @route   GET /api/recommendations/category/:categoryId/trending
// @desc    Get trending books in category
// @access  Public
router.get('/category/:categoryId/trending', getTrendingByCategory);

// @route   POST /api/recommendations/categories
// @desc    Get recommendations for multiple categories
// @access  Private
router.post('/categories', protect, getMultiCategoryRecommendations);

// @route   GET /api/recommendations/filters/categories
// @desc    Get available categories for filtering
// @access  Public
router.get('/filters/categories', getAvailableCategories);

module.exports = router;
