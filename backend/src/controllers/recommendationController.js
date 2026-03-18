const { validationResult } = require('express-validator');
const recommendationService = require('../services/recommendationService');

// @desc    Get comprehensive recommendations combining all strategies with pagination and filtering
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      includePersonalized: req.query.personalized !== 'false',
      includePopular: req.query.popular !== 'false',
      includeSemester: req.query.semester !== 'false',
      includeCollaborative: req.query.collaborative !== 'false',
      includeCategory: req.query.category !== 'false',
      category: req.query.category,
      author: req.query.author,
      minYear: req.query.minYear,
      maxYear: req.query.maxYear,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'desc'
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

// @desc    Get personalized recommendations based on user history with filtering
// @route   GET /api/recommendations/personalized
// @access  Private
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      category: req.query.category,
      author: req.query.author,
      minYear: req.query.minYear,
      maxYear: req.query.maxYear,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'desc'
    };
    
    const recommendations = await recommendationService.getRecommendationsForUser(userId, options);

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

// @desc    Get popular books recommendations with filtering
// @route   GET /api/recommendations/popular
// @access  Public
exports.getPopularRecommendations = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      category: req.query.category,
      author: req.query.author,
      minYear: req.query.minYear,
      maxYear: req.query.maxYear,
      sortBy: req.query.sortBy || 'borrowCount',
      sortOrder: req.query.sortOrder || 'desc'
    };
    
    const recommendations = await recommendationService.getPopularBooks(options.limit, options);

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

// @desc    Get collaborative recommendations based on similar users with filtering
// @route   GET /api/recommendations/collaborative
// @access  Private
exports.getCollaborativeRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      category: req.query.category,
      author: req.query.author,
      minYear: req.query.minYear,
      maxYear: req.query.maxYear,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'desc'
    };
    
    const recommendations = await recommendationService.getCollaborativeRecommendations(userId, options);

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

// @desc    Get semester-based recommendations with filtering
// @route   GET /api/recommendations/semester
// @access  Private
exports.getSemesterRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      category: req.query.category,
      author: req.query.author,
      minYear: req.query.minYear,
      maxYear: req.query.maxYear,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'desc'
    };
    
    const recommendations = await recommendationService.getSemesterBasedRecommendations(userId, options);

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

// @desc    Get academic progress recommendations with filtering
// @route   GET /api/recommendations/academic
// @access  Private
exports.getAcademicRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      category: req.query.category,
      author: req.query.author,
      minYear: req.query.minYear,
      maxYear: req.query.maxYear,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'desc'
    };
    
    const recommendations = await recommendationService.getAcademicProgressRecommendations(userId, options);

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

// @desc    Get semester trending books with filtering
// @route   GET /api/recommendations/semester/trending
// @access  Public
exports.getSemesterTrending = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      category: req.query.category,
      author: req.query.author,
      minYear: req.query.minYear,
      maxYear: req.query.maxYear,
      sortBy: req.query.sortBy || 'borrowCount',
      sortOrder: req.query.sortOrder || 'desc'
    };
    
    const trendingBooks = await recommendationService.getSemesterTrendingBooks(options.limit, options);

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

// @desc    Get similar books recommendations with filtering
// @route   GET /api/recommendations/similar/:bookId
// @access  Public
exports.getSimilarBooks = async (req, res) => {
  try {
    const { bookId } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      category: req.query.category,
      author: req.query.author,
      minYear: req.query.minYear,
      maxYear: req.query.maxYear,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'desc'
    };
    
    const similarBooks = await recommendationService.getSimilarBooks(bookId, options);

    res.status(200).json({
      success: true,
      message: 'Similar books retrieved successfully',
      data: similarBooks
    });
  } catch (error) {
    console.error('Error getting similar books:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting similar books'
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

// @desc    Get available authors for filtering
// @route   GET /api/recommendations/filters/authors
// @access  Public
exports.getAvailableAuthors = async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search
    };
    
    const authors = await recommendationService.getAvailableAuthors(options);

    res.status(200).json({
      success: true,
      message: 'Available authors retrieved successfully',
      data: authors
    });
  } catch (error) {
    console.error('Error getting available authors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting available authors'
    });
  }
};
