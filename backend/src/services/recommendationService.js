const Book = require('../models/Book');
const BorrowRecord = require('../models/BorrowRecord');
const Category = require('../models/Category');
const User = require('../models/User');

class RecommendationService {
  
  /**
   * Get comprehensive recommendations combining all strategies with pagination and filtering
   * @param {string} userId - User ID
   * @param {Object} options - Recommendation options
   * @returns {Promise<Object>} - Combined recommendations with pagination
   */
  async getComprehensiveRecommendations(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        includePersonalized = true,
        includePopular = true,
        includeSemester = true,
        includeCollaborative = true,
        includeCategory = true,
        category,
        author,
        minYear,
        maxYear,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const recommendations = {};

      // Get user information
      const user = await User.findById(userId);
      const currentSemester = this.getCurrentSemester();

      // Build filter criteria
      const filterCriteria = this.buildFilterCriteria({ category, author, minYear, maxYear });

      // 1. Personalized recommendations based on user history
      if (includePersonalized) {
        recommendations.personalized = await this.getRecommendationsForUser(userId, {
          limit: Math.ceil(limit / 2),
          filter: filterCriteria,
          sortBy,
          sortOrder
        });
      }

      // 2. Popular books
      if (includePopular) {
        recommendations.popular = await this.getPopularBooks(Math.ceil(limit / 2), {
          filter: filterCriteria,
          sortBy,
          sortOrder
        });
      }

      // 3. Semester-based recommendations
      if (includeSemester) {
        recommendations.semester = await this.getSemesterBasedRecommendations(userId, {
          limit: Math.ceil(limit / 2),
          filter: filterCriteria,
          sortBy,
          sortOrder
        });
      }

      // 4. Collaborative filtering
      if (includeCollaborative) {
        recommendations.collaborative = await this.getCollaborativeRecommendations(userId, {
          limit: Math.ceil(limit / 2),
          filter: filterCriteria,
          sortBy,
          sortOrder
        });
      }

      // 5. Category-based recommendations
      if (includeCategory) {
        recommendations.category = await this.getAcademicProgressRecommendations(userId, {
          limit: Math.ceil(limit / 2),
          filter: filterCriteria,
          sortBy,
          sortOrder
        });
      }

      // Combine and paginate results
      const allRecommendations = this.combineRecommendations(recommendations);
      const paginatedResults = this.paginateResults(allRecommendations, page, limit);

      // Add metadata
      paginatedResults.metadata = {
        userId,
        semester: currentSemester,
        userDepartment: user?.department || 'General',
        userRole: user?.role || 'student',
        generatedAt: new Date().toISOString(),
        strategies: Object.keys(recommendations).filter(key => key !== 'metadata'),
        filters: { category, author, minYear, maxYear },
        sorting: { sortBy, sortOrder }
      };

      return paginatedResults;
    } catch (error) {
      console.error('Error in getComprehensiveRecommendations:', error);
      throw error;
    }
  }

  /**
   * Build filter criteria for book queries
   * @param {Object} filters - Filter options
   * @returns {Object} - MongoDB filter object
   */
  buildFilterCriteria(filters) {
    const { category, author, minYear, maxYear } = filters;
    const criteria = { status: 'available' };

    if (category) {
      criteria.category = category;
    }

    if (author) {
      criteria.author = { $regex: author, $options: 'i' };
    }

    if (minYear || maxYear) {
      criteria.publishedYear = {};
      if (minYear) criteria.publishedYear.$gte = parseInt(minYear);
      if (maxYear) criteria.publishedYear.$lte = parseInt(maxYear);
    }

    return criteria;
  }

  /**
   * Combine recommendations from different strategies
   * @param {Object} recommendations - Object with recommendation arrays
   * @returns {Array} - Combined and deduplicated recommendations
   */
  combineRecommendations(recommendations) {
    const seen = new Set();
    const combined = [];

    Object.entries(recommendations).forEach(([strategy, books]) => {
      if (Array.isArray(books)) {
        books.forEach(book => {
          const bookId = book._id?.toString();
          if (bookId && !seen.has(bookId)) {
            seen.add(bookId);
            combined.push({
              ...book,
              strategies: [strategy],
              relevanceScore: this.calculateRelevanceScore(book, strategy)
            });
          } else if (bookId && seen.has(bookId)) {
            // Update strategies if book already exists
            const existingBook = combined.find(b => b._id?.toString() === bookId);
            if (existingBook && !existingBook.strategies.includes(strategy)) {
              existingBook.strategies.push(strategy);
              existingBook.relevanceScore = Math.max(existingBook.relevanceScore, 
                this.calculateRelevanceScore(book, strategy));
            }
          }
        });
      }
    });

    return combined;
  }

  /**
   * Calculate relevance score for a book
   * @param {Object} book - Book object
   * @param {string} strategy - Recommendation strategy
   * @returns {number} - Relevance score
   */
  calculateRelevanceScore(book, strategy) {
    const baseScores = {
      'user-history': 0.9,
      'collaborative': 0.85,
      'semester-based': 0.8,
      'academic-progress': 0.75,
      'category-preference': 0.7,
      'popularity': 0.6,
      'semester-trending': 0.65,
      'similarity': 0.8
    };

    let score = baseScores[strategy] || 0.5;

    // Boost score based on additional factors
    if (book.borrowCount) score += Math.min(book.borrowCount * 0.01, 0.2);
    if (book.recommendationScore) score += Math.min(book.recommendationScore * 0.05, 0.15);
    if (book.createdAt) {
      const daysSinceCreation = (Date.now() - new Date(book.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 30) score += 0.1; // Boost new books
    }

    return Math.min(score, 1.0);
  }

  /**
   * Paginate results
   * @param {Array} results - Array of results
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} - Paginated results
   */
  paginateResults(results, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedResults = results.slice(startIndex, endIndex);
    
    return {
      data: paginatedResults,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: results.length,
        totalPages: Math.ceil(results.length / limit),
        hasNextPage: endIndex < results.length,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Get recommendations based on user's borrowing history with filtering
   * @param {string} userId - User ID
   * @param {Object} options - Options including filter, sort, pagination
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getRecommendationsForUser(userId, options = {}) {
    try {
      const { limit = 10, filter = {}, sortBy = 'relevance', sortOrder = 'desc' } = options;
      
      // Get user's borrowing history
      const borrowHistory = await BorrowRecord.find({ 
        userId: userId,
        status: 'returned'
      })
      .populate('bookId')
      .sort({ returnDate: -1 })
      .limit(20);

      if (borrowHistory.length === 0) {
        return await this.getPopularBooks(limit, { filter, sortBy, sortOrder });
      }

      // Extract categories from user's borrowing history
      const userCategories = borrowHistory.map(record => record.bookId.category);
      const uniqueCategories = [...new Set(userCategories)];

      // Build query with filters
      const query = {
        category: { $in: uniqueCategories },
        _id: { $nin: borrowHistory.map(record => record.bookId._id) },
        ...filter
      };

      // Get books from same categories
      const recommendations = await Book.find(query)
      .populate('category', 'name code')
      .limit(limit)
      .sort(this.buildSortOptions(sortBy, sortOrder));

      return recommendations.map(book => ({
        ...book.toObject(),
        recommendationReason: 'Based on your borrowing history',
        strategy: 'user-history'
      }));
    } catch (error) {
      console.error('Error in getRecommendationsForUser:', error);
      throw error;
    }
  }

  /**
   * Get popular books based on borrow count with filtering
   * @param {number} limit - Number of recommendations to return
   * @param {Object} options - Options including filter, sort
   * @returns {Promise<Array>} - Array of popular books
   */
  async getPopularBooks(limit = 10, options = {}) {
    try {
      const { filter = {}, sortBy = 'borrowCount', sortOrder = 'desc' } = options;
      
      const pipeline = [
        {
          $match: {
            status: 'returned'
          }
        },
        {
          $group: {
            _id: '$bookId',
            borrowCount: { $sum: 1 }
          }
        },
        {
          $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        },
        {
          $limit: limit * 2 // Get more to filter later
        },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookInfo'
          }
        },
        {
          $unwind: '$bookInfo'
        },
        {
          $match: {
            'bookInfo.status': 'available'
          }
        }
      ];

      // Add additional filters
      if (filter.category) {
        pipeline.push({
          $match: {
            'bookInfo.category': require('mongoose').Types.ObjectId(filter.category)
          }
        });
      }

      if (filter.author) {
        pipeline.push({
          $match: {
            'bookInfo.author': { $regex: filter.author, $options: 'i' }
          }
        });
      }

      pipeline.push(
        {
          $lookup: {
            from: 'categories',
            localField: 'bookInfo.category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $unwind: '$categoryInfo'
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                '$bookInfo',
                {
                  category: '$categoryInfo',
                  borrowCount: '$borrowCount',
                  recommendationReason: 'Popular among all users',
                  strategy: 'popularity'
                }
              ]
            }
          }
        },
        {
          $limit: limit
        }
      );

      const popularBooks = await BorrowRecord.aggregate(pipeline);
      return popularBooks;
    } catch (error) {
      console.error('Error in getPopularBooks:', error);
      throw error;
    }
  }

  /**
   * Get similar books based on book ID with filtering
   * @param {string} bookId - Book ID
   * @param {Object} options - Options including filter, sort, pagination
   * @returns {Promise<Array>} - Array of similar books
   */
  async getSimilarBooks(bookId, options = {}) {
    try {
      const { limit = 10, filter = {}, sortBy = 'relevance', sortOrder = 'desc' } = options;
      
      const book = await Book.findById(bookId).populate('category');
      
      if (!book) {
        return [];
      }

      // Build query with filters
      const query = {
        _id: { $ne: bookId },
        $or: [
          { category: book.category._id },
          { title: { $regex: book.author, $options: 'i' } }
        ],
        ...filter
      };

      const similarBooks = await Book.find(query)
      .populate('category', 'name code')
      .limit(limit)
      .sort(this.buildSortOptions(sortBy, sortOrder));

      return similarBooks.map(b => ({
        ...b.toObject(),
        recommendationReason: `Similar to "${book.title}"`,
        strategy: 'similarity'
      }));
    } catch (error) {
      console.error('Error in getSimilarBooks:', error);
      throw error;
    }
  }

  /**
   * Build sort options for MongoDB queries
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order (asc/desc)
   * @returns {Object} - Sort options object
   */
  buildSortOptions(sortBy, sortOrder) {
    const sortField = sortBy === 'relevance' ? 'createdAt' : sortBy;
    return { [sortField]: sortOrder === 'desc' ? -1 : 1 };
  }

  /**
   * Get recommendations based on user's most frequently borrowed categories with filtering
   * @param {string} userId - User ID
   * @param {Object} options - Options including filter, sort, pagination
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getRecommendationsByUserCategories(userId, options = {}) {
    try {
      const { limit = 10, filter = {}, sortBy = 'relevance', sortOrder = 'desc' } = options;
      
      // Get user's borrowing history with category frequency
      const categoryFrequency = await BorrowRecord.aggregate([
        {
          $match: {
            userId: require('mongoose').Types.ObjectId(userId),
            status: 'returned'
          }
        },
        {
          $lookup: {
            from: 'books',
            localField: 'bookId',
            foreignField: '_id',
            as: 'bookInfo'
          }
        },
        {
          $unwind: '$bookInfo'
        },
        {
          $group: {
            _id: '$bookInfo.category',
            borrowCount: { $sum: 1 },
            categoryName: { $first: '$bookInfo.category' }
          }
        },
        {
          $sort: { borrowCount: -1 }
        },
        {
          $limit: 3
        }
      ]);

      if (categoryFrequency.length === 0) {
        return await this.getPopularBooks(limit, { filter, sortBy, sortOrder });
      }

      const topCategories = categoryFrequency.map(cat => cat._id);

      // Get books from top categories that user hasn't borrowed
      const userBorrowedBooks = await BorrowRecord.find({
        userId: userId,
        status: { $in: ['returned', 'approved'] }
      }).distinct('bookId');

      const query = {
        category: { $in: topCategories },
        _id: { $nin: userBorrowedBooks },
        ...filter
      };

      const recommendations = await Book.find(query)
      .populate('category', 'name code')
      .limit(limit)
      .sort(this.buildSortOptions(sortBy, sortOrder));

      return recommendations.map(book => ({
        ...book.toObject(),
        recommendationReason: 'Based on your favorite categories',
        strategy: 'category-preference'
      }));
    } catch (error) {
      console.error('Error in getRecommendationsByUserCategories:', error);
      throw error;
    }
  }

  /**
   * Get recommendations based on users with similar borrowing patterns with filtering
   * @param {string} userId - User ID
   * @param {Object} options - Options including filter, sort, pagination
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getCollaborativeRecommendations(userId, options = {}) {
    try {
      const { limit = 10, filter = {}, sortBy = 'relevance', sortOrder = 'desc' } = options;
      
      // Get user's borrowed books
      const userBooks = await BorrowRecord.find({
        userId: userId,
        status: 'returned'
      }).distinct('bookId');

      if (userBooks.length === 0) {
        return await this.getRecommendationsByUserCategories(userId, { filter, sortBy, sortOrder });
      }

      // Find users who borrowed similar books
      const similarUsers = await BorrowRecord.aggregate([
        {
          $match: {
            bookId: { $in: userBooks },
            status: 'returned',
            userId: { $ne: require('mongoose').Types.ObjectId(userId) }
          }
        },
        {
          $group: {
            _id: '$userId',
            commonBooksCount: { $sum: 1 }
          }
        },
        {
          $match: {
            commonBooksCount: { $gte: 2 }
          }
        },
        {
          $sort: { commonBooksCount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      if (similarUsers.length === 0) {
        return await this.getRecommendationsByUserCategories(userId, { filter, sortBy, sortOrder });
      }

      const similarUserIds = similarUsers.map(user => user._id);

      // Build pipeline with filters
      const pipeline = [
        {
          $match: {
            userId: { $in: similarUserIds },
            status: 'returned',
            bookId: { $nin: userBooks }
          }
        },
        {
          $group: {
            _id: '$bookId',
            recommendationScore: { $sum: 1 }
          }
        },
        {
          $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        },
        {
          $limit: limit * 2
        },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookInfo'
          }
        },
        {
          $unwind: '$bookInfo'
        },
        {
          $match: {
            'bookInfo.status': 'available'
          }
        }
      ];

      // Add additional filters
      if (filter.category) {
        pipeline.push({
          $match: {
            'bookInfo.category': require('mongoose').Types.ObjectId(filter.category)
          }
        });
      }

      if (filter.author) {
        pipeline.push({
          $match: {
            'bookInfo.author': { $regex: filter.author, $options: 'i' }
          }
        });
      }

      pipeline.push(
        {
          $lookup: {
            from: 'categories',
            localField: 'bookInfo.category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $unwind: '$categoryInfo'
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                '$bookInfo',
                {
                  category: '$categoryInfo',
                  recommendationScore: '$recommendationScore',
                  recommendationReason: 'Users with similar interests also liked this',
                  strategy: 'collaborative'
                }
              ]
            }
          }
        },
        {
          $limit: limit
        }
      );

      const recommendations = await BorrowRecord.aggregate(pipeline);
      return recommendations;
    } catch (error) {
      console.error('Error in getCollaborativeRecommendations:', error);
      throw error;
    }
  }

  /**
   * Get current semester based on date
   * @returns {Object} - Current semester info
   */
  getCurrentSemester() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    
    let semester, semesterName;
    
    if (month >= 1 && month <= 5) {
      semester = 'Spring';
      semesterName = 'Spring Semester';
    } else if (month >= 6 && month <= 8) {
      semester = 'Summer';
      semesterName = 'Summer Semester';
    } else {
      semester = 'Fall';
      semesterName = 'Fall Semester';
    }
    
    return {
      semester,
      semesterName,
      year,
      academicYear: `${year}-${year + 1}`
    };
  }

  /**
   * Get semester-based recommendations for user with filtering
   * @param {string} userId - User ID
   * @param {Object} options - Options including filter, sort, pagination
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getSemesterBasedRecommendations(userId, options = {}) {
    try {
      const { limit = 10, filter = {}, sortBy = 'relevance', sortOrder = 'desc' } = options;
      
      const user = await User.findById(userId);
      const currentSemester = this.getCurrentSemester();
      
      // Get user's department and estimated year based on account creation
      const userDepartment = user?.department || 'General';
      const accountAge = this.calculateUserYear(user.createdAt);
      
      // Define semester-specific categories
      const semesterCategories = this.getSemesterCategories(currentSemester.semester);
      
      // Build query with filters
      const query = {
        category: { $in: semesterCategories },
        ...filter
      };

      // Get books from semester-appropriate categories
      const recommendations = await Book.find(query)
      .populate('category', 'name code')
      .limit(limit)
      .sort(this.buildSortOptions(sortBy, sortOrder));

      // Add semester context to recommendations
      return recommendations.map(book => ({
        ...book.toObject(),
        recommendationReason: `Recommended for ${currentSemester.semesterName} - ${userDepartment} students`,
        semester: currentSemester.semester,
        academicYear: currentSemester.academicYear,
        strategy: 'semester-based'
      }));
    } catch (error) {
      console.error('Error in getSemesterBasedRecommendations:', error);
      throw error;
    }
  }

  /**
   * Get categories appropriate for current semester
   * @param {string} semester - Current semester (Spring, Summer, Fall)
   * @returns {Array} - Array of category names/codes
   */
  getSemesterCategories(semester) {
    const categoryMap = {
      'Spring': [
        'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 
        'Engineering', 'Business', 'Economics'
      ],
      'Summer': [
        'Programming', 'Web Development', 'Data Science', 'Machine Learning',
        'Mobile Development', 'Database', 'Software Engineering'
      ],
      'Fall': [
        'Literature', 'History', 'Philosophy', 'Arts', 'Social Sciences',
        'Psychology', 'Education', 'Research'
      ]
    };
    
    return categoryMap[semester] || categoryMap['Fall'];
  }

  /**
   * Calculate user's estimated year based on account creation date
   * @param {Date} createdAt - User account creation date
   * @returns {number} - Estimated year (1-4)
   */
  calculateUserYear(createdAt) {
    if (!createdAt) return 1;
    
    const now = new Date();
    const created = new Date(createdAt);
    const monthsDiff = (now.getFullYear() - created.getFullYear()) * 12 + 
                      (now.getMonth() - created.getMonth());
    
    // Approximate: 4 months = 1 semester, 2 semesters = 1 year
    const year = Math.min(Math.floor(monthsDiff / 8) + 1, 4);
    return year;
  }

  /**
   * Get recommendations based on user's academic progress with filtering
   * @param {string} userId - User ID
   * @param {Object} options - Options including filter, sort, pagination
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getAcademicProgressRecommendations(userId, options = {}) {
    try {
      const { limit = 10, filter = {}, sortBy = 'relevance', sortOrder = 'desc' } = options;
      
      const user = await User.findById(userId);
      const currentSemester = this.getCurrentSemester();
      const userYear = this.calculateUserYear(user.createdAt);
      const userDepartment = user?.department || 'General';
      
      // Get user's borrowing history to understand their interests
      const borrowHistory = await BorrowRecord.find({
        userId: userId,
        status: 'returned'
      })
      .populate('bookId')
      .sort({ returnDate: -1 })
      .limit(10);

      // Get categories based on user's year and department
      const appropriateCategories = this.getYearBasedCategories(userYear, userDepartment);
      
      // Build query with filters
      const query = {
        category: { $in: appropriateCategories },
        _id: { $nin: borrowHistory.map(record => record.bookId._id) },
        ...filter
      };

      // Get recommendations
      const recommendations = await Book.find(query)
      .populate('category', 'name code')
      .limit(limit)
      .sort(this.buildSortOptions(sortBy, sortOrder));

      return recommendations.map(book => ({
        ...book.toObject(),
        recommendationReason: `Recommended for Year ${userYear} ${userDepartment} students`,
        academicLevel: `Year ${userYear}`,
        semester: currentSemester.semester,
        strategy: 'academic-progress'
      }));
    } catch (error) {
      console.error('Error in getAcademicProgressRecommendations:', error);
      throw error;
    }
  }

  /**
   * Get categories appropriate for user's academic year
   * @param {number} year - User's academic year (1-4)
   * @param {string} department - User's department
   * @returns {Array} - Array of category names
   */
  getYearBasedCategories(year, department) {
    const yearCategories = {
      1: ['Introduction', 'Basic', 'Fundamentals', 'Beginner'],
      2: ['Intermediate', 'Advanced', 'Applied', 'Practical'],
      3: ['Specialized', 'Professional', 'Research', 'Analysis'],
      4: ['Thesis', 'Capstone', 'Advanced Research', 'Professional Development']
    };
    
    const departmentCategories = {
      'Computer Science': ['Programming', 'Algorithms', 'Data Structures', 'Software Engineering'],
      'Business': ['Management', 'Marketing', 'Finance', 'Accounting'],
      'Engineering': ['Mathematics', 'Physics', 'Design', 'Systems'],
      'General': ['General Education', 'Liberal Arts', 'Science', 'Humanities']
    };
    
    const baseCategories = yearCategories[year] || yearCategories[1];
    const deptCategories = departmentCategories[department] || departmentCategories['General'];
    
    return [...baseCategories, ...deptCategories];
  }

  /**
   * Get trending books for current semester with filtering
   * @param {number} limit - Number of recommendations to return
   * @param {Object} options - Options including filter, sort
   * @returns {Promise<Array>} - Array of trending books
   */
  async getSemesterTrendingBooks(limit = 10, options = {}) {
    try {
      const { filter = {}, sortBy = 'borrowCount', sortOrder = 'desc' } = options;
      const currentSemester = this.getCurrentSemester();
      const semesterStart = this.getSemesterStartDate(currentSemester.semester);
      
      const pipeline = [
        {
          $match: {
            borrowDate: { $gte: semesterStart },
            status: 'returned'
          }
        },
        {
          $group: {
            _id: '$bookId',
            borrowCount: { $sum: 1 }
          }
        },
        {
          $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        },
        {
          $limit: limit * 2
        },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookInfo'
          }
        },
        {
          $unwind: '$bookInfo'
        },
        {
          $match: {
            'bookInfo.status': 'available'
          }
        }
      ];

      // Add additional filters
      if (filter.category) {
        pipeline.push({
          $match: {
            'bookInfo.category': require('mongoose').Types.ObjectId(filter.category)
          }
        });
      }

      if (filter.author) {
        pipeline.push({
          $match: {
            'bookInfo.author': { $regex: filter.author, $options: 'i' }
          }
        });
      }

      pipeline.push(
        {
          $lookup: {
            from: 'categories',
            localField: 'bookInfo.category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $unwind: '$categoryInfo'
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                '$bookInfo',
                {
                  category: '$categoryInfo',
                  borrowCount: '$borrowCount',
                  semester: currentSemester.semester,
                  recommendationReason: `Trending in ${currentSemester.semesterName}`,
                  strategy: 'semester-trending'
                }
              ]
            }
          }
        },
        {
          $limit: limit
        }
      );

      const trendingBooks = await BorrowRecord.aggregate(pipeline);
      return trendingBooks;
    } catch (error) {
      console.error('Error in getSemesterTrendingBooks:', error);
      throw error;
    }
  }

  /**
   * Get semester start date
   * @param {string} semester - Semester name
   * @returns {Date} - Semester start date
   */
  getSemesterStartDate(semester) {
    const now = new Date();
    const year = now.getFullYear();
    
    let month, day;
    switch (semester) {
      case 'Spring':
        month = 1; day = 15;
        break;
      case 'Summer':
        month = 6; day = 1;
        break;
      case 'Fall':
        month = 9; day = 1;
        break;
      default:
        month = 9; day = 1;
    }
    
    return new Date(year, month - 1, day);
  }

  /**
   * Get available categories for filtering
   * @returns {Promise<Array>} - Array of categories
   */
  async getAvailableCategories() {
    try {
      const categories = await Category.find({ status: 'active' })
        .select('name code')
        .sort({ name: 1 });
      
      return categories;
    } catch (error) {
      console.error('Error in getAvailableCategories:', error);
      throw error;
    }
  }

  /**
   * Get available authors for filtering
   * @param {Object} options - Options including limit, search
   * @returns {Promise<Array>} - Array of authors
   */
  async getAvailableAuthors(options = {}) {
    try {
      const { limit = 50, search } = options;
      
      const matchStage = { status: 'available' };
      if (search) {
        matchStage.author = { $regex: search, $options: 'i' };
      }

      const authors = await Book.aggregate([
        { $match: matchStage },
        { $group: { _id: '$author', bookCount: { $sum: 1 } } },
        { $sort: { bookCount: -1 } },
        { $limit: limit },
        { $project: { name: '$_id', bookCount: 1, _id: 0 } }
      ]);

      return authors;
    } catch (error) {
      console.error('Error in getAvailableAuthors:', error);
      throw error;
    }
  }
}

module.exports = new RecommendationService();
