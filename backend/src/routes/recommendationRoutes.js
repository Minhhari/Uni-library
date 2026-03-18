const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getPersonalizedRecommendations,
  getPopularRecommendations
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

// @route   GET /api/recommendations
// @desc    Get book recommendations for user
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

module.exports = router;
