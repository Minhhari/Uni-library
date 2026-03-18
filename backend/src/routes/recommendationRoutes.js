const express = require('express');
const router = express.Router();
const {
  getSemesterRecommendations,
  getAcademicRecommendations,
  getSemesterTrending,
  getSemesterInfo
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

// @route   GET /api/recommendations/semester
// @desc    Get semester-based recommendations
// @access  Private
router.get('/semester', protect, getSemesterRecommendations);

// @route   GET /api/recommendations/academic
// @desc    Get academic progress recommendations
// @access  Private
router.get('/academic', protect, getAcademicRecommendations);

// @route   GET /api/recommendations/semester/trending
// @desc    Get semester trending books
// @access  Public
router.get('/semester/trending', getSemesterTrending);

// @route   GET /api/recommendations/semester/info
// @desc    Get current semester information
// @access  Public
router.get('/semester/info', getSemesterInfo);

module.exports = router;
