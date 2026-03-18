const { validationResult } = require('express-validator');
const recommendationService = require('../services/recommendationService');

// @desc    Get semester-based recommendations
// @route   GET /api/recommendations/semester
// @access  Private
exports.getSemesterRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationService.getSemesterBasedRecommendations(userId, limit);

    res.status(200).json({
      success: true,
      message: 'Semester-based recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting semester recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting semester recommendations'
    });
  }
};

// @desc    Get academic progress recommendations
// @route   GET /api/recommendations/academic
// @access  Private
exports.getAcademicRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationService.getAcademicProgressRecommendations(userId, limit);

    res.status(200).json({
      success: true,
      message: 'Academic progress recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting academic recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting academic recommendations'
    });
  }
};

// @desc    Get semester trending books
// @route   GET /api/recommendations/semester/trending
// @access  Public
exports.getSemesterTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const trendingBooks = await recommendationService.getSemesterTrendingBooks(limit);

    res.status(200).json({
      success: true,
      message: 'Semester trending books retrieved successfully',
      data: trendingBooks
    });
  } catch (error) {
    console.error('Error getting semester trending books:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting semester trending books'
    });
  }
};

// @desc    Get current semester information
// @route   GET /api/recommendations/semester/info
// @access  Public
exports.getSemesterInfo = async (req, res) => {
  try {
    const semesterInfo = recommendationService.getCurrentSemester();

    res.status(200).json({
      success: true,
      message: 'Current semester information retrieved successfully',
      data: semesterInfo
    });
  } catch (error) {
    console.error('Error getting semester info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting semester info'
    });
  }
};
