const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getPersonalizedRecommendations,
  getPopularRecommendations,
  getCollaborativeRecommendations,
  getSemesterRecommendations,
  getAcademicRecommendations,
  getSemesterInfo
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/recommendations
// @desc    Get comprehensive recommendations combining all strategies
// @access  Private
router.get('/', protect, getRecommendations);

// @route   GET /api/recommendations/personalized
// @desc    Get personalized recommendations based on user history
// @access  Private
router.get('/personalized', protect, getPersonalizedRecommendations);

// @route   GET /api/recommendations/popular
// @desc    Get popular books recommendations
// @access  Public
router.get('/popular', getPopularRecommendations);

// @route   GET /api/recommendations/collaborative
// @desc    Get collaborative recommendations based on similar users
// @access  Private
router.get('/collaborative', protect, getCollaborativeRecommendations);

// @route   GET /api/recommendations/semester
// @desc    Get semester-based recommendations
// @access  Private
router.get('/semester', protect, getSemesterRecommendations);

// @route   GET /api/recommendations/academic
// @desc    Get academic progress recommendations
// @access  Private
router.get('/academic', protect, getAcademicRecommendations);

// @route   GET /api/recommendations/semester/info
// @desc    Get current semester information
// @access  Public
router.get('/semester/info', getSemesterInfo);

module.exports = router;
