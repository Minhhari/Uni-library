const { validationResult } = require('express-validator');
const recommendationService = require('../services/recommendationService');

// @desc    Get book recommendations for user
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = await recommendationService.getRecommendationsForUser(userId);

    res.status(200).json({
      success: true,
      message: 'User recommendations retrieved successfully',
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
    
    const recommendations = await recommendationService.getRecommendationsByUserCategories(userId, limit);

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
