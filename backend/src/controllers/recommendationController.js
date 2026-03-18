const { validationResult } = require('express-validator');
const recommendationService = require('../services/recommendationService');

// @desc    Get comprehensive recommendations combining all strategies
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      limit: parseInt(req.query.limit) || 10,
      includePersonalized: req.query.personalized !== 'false',
      includePopular: req.query.popular !== 'false',
      includeSemester: req.query.semester !== 'false',
      includeCollaborative: req.query.collaborative !== 'false',
      includeCategory: req.query.category !== 'false'
    };
    
    const recommendations = await recommendationService.getComprehensiveRecommendations(userId, options);

    res.status(200).json({
      success: true,
      message: 'Comprehensive recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting recommendations'
    });
  }
};

// @desc    Get personalized recommendations based on user history
// @route   GET /api/recommendations/personalized
// @access  Private
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationService.getRecommendationsForUser(userId, limit);

    res.status(200).json({
      success: true,
      message: 'Personalized recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting personalized recommendations'
    });
  }
};

// @desc    Get popular books recommendations
// @route   GET /api/recommendations/popular
// @access  Public
exports.getPopularRecommendations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recommendations = await recommendationService.getPopularBooks(limit);

    res.status(200).json({
      success: true,
      message: 'Popular recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting popular recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting popular recommendations'
    });
  }
};

// @desc    Get collaborative recommendations based on similar users
// @route   GET /api/recommendations/collaborative
// @access  Private
exports.getCollaborativeRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationService.getCollaborativeRecommendations(userId, limit);

    res.status(200).json({
      success: true,
      message: 'Collaborative recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting collaborative recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting collaborative recommendations'
    });
  }
};

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
