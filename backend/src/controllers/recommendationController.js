const { validationResult } = require('express-validator');
const recommendationService = require('../services/recommendationService');

// @desc    Get recommendations based on category
// @route   GET /api/recommendations/category/:categoryId
// @access  Public
exports.getCategoryRecommendations = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const recommendations = await recommendationService.getCategoryBasedRecommendations(categoryId, limit);

    res.status(200).json({
      success: true,
      message: 'Category-based recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting category recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting category recommendations'
    });
  }
};

// @desc    Get trending books in category
// @route   GET /api/recommendations/category/:categoryId/trending
// @access  Public
exports.getTrendingByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const trendingBooks = await recommendationService.getTrendingBooksByCategory(categoryId, limit);

    res.status(200).json({
      success: true,
      message: 'Trending books in category retrieved successfully',
      data: trendingBooks
    });
  } catch (error) {
    console.error('Error getting trending books by category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting trending books by category'
    });
  }
};

// @desc    Get recommendations for multiple categories
// @route   POST /api/recommendations/categories
// @access  Private
exports.getMultiCategoryRecommendations = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    const limit = parseInt(req.query.limit) || 5;

    if (!categoryIds || !Array.isArray(categoryIds)) {
      return res.status(400).json({
        success: false,
        message: 'Category IDs array is required'
      });
    }

    const recommendations = await recommendationService.getMultiCategoryRecommendations(categoryIds, limit);

    res.status(200).json({
      success: true,
      message: 'Multi-category recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting multi-category recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting multi-category recommendations'
    });
  }
};

// @desc    Get available categories for filtering
// @route   GET /api/recommendations/filters/categories
// @access  Public
exports.getAvailableCategories = async (req, res) => {
  try {
    const categories = await recommendationService.getAvailableCategories();

    res.status(200).json({
      success: true,
      message: 'Available categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('Error getting available categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting available categories'
    });
  }
};
