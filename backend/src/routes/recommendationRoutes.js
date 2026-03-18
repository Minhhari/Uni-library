const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getPersonalizedRecommendations,
  getPopularRecommendations,
  getCollaborativeRecommendations,
  getSemesterRecommendations,
  getAcademicRecommendations,
  getSemesterTrending,
  getSemesterInfo,
  getSimilarBooks,
  getAvailableCategories,
  getAvailableAuthors
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

// @route   GET /api/recommendations
// @desc    Get comprehensive recommendations combining all strategies with pagination and filtering
// @access  Private
// Query params: page, limit, personalized, popular, semester, collaborative, category, author, minYear, maxYear, sortBy, sortOrder
router.get('/', protect, getRecommendations);

// @route   GET /api/recommendations/personalized
// @desc    Get personalized recommendations based on user history with filtering
// @access  Private
// Query params: page, limit, category, author, minYear, maxYear, sortBy, sortOrder
router.get('/personalized', protect, getPersonalizedRecommendations);

// @route   GET /api/recommendations/popular
// @desc    Get popular books recommendations with filtering
// @access  Public
// Query params: page, limit, category, author, minYear, maxYear, sortBy, sortOrder
router.get('/popular', getPopularRecommendations);

// @route   GET /api/recommendations/collaborative
// @desc    Get collaborative recommendations based on similar users with filtering
// @access  Private
// Query params: page, limit, category, author, minYear, maxYear, sortBy, sortOrder
router.get('/collaborative', protect, getCollaborativeRecommendations);

// @route   GET /api/recommendations/semester
// @desc    Get semester-based recommendations with filtering
// @access  Private
// Query params: page, limit, category, author, minYear, maxYear, sortBy, sortOrder
router.get('/semester', protect, getSemesterRecommendations);

// @route   GET /api/recommendations/academic
// @desc    Get academic progress recommendations with filtering
// @access  Private
// Query params: page, limit, category, author, minYear, maxYear, sortBy, sortOrder
router.get('/academic', protect, getAcademicRecommendations);

// @route   GET /api/recommendations/semester/trending
// @desc    Get semester trending books with filtering
// @access  Public
// Query params: page, limit, category, author, minYear, maxYear, sortBy, sortOrder
router.get('/semester/trending', getSemesterTrending);

// @route   GET /api/recommendations/semester/info
// @desc    Get current semester information
// @access  Public
router.get('/semester/info', getSemesterInfo);

// @route   GET /api/recommendations/similar/:bookId
// @desc    Get similar books recommendations with filtering
// @access  Public
// Query params: page, limit, category, author, minYear, maxYear, sortBy, sortOrder
router.get('/similar/:bookId', getSimilarBooks);

// @route   GET /api/recommendations/filters/categories
// @desc    Get available categories for filtering
// @access  Public
// Query params: none
router.get('/filters/categories', getAvailableCategories);

// @route   GET /api/recommendations/filters/authors
// @desc    Get available authors for filtering
// @access  Public
// Query params: limit, search
router.get('/filters/authors', getAvailableAuthors);

module.exports = router;
