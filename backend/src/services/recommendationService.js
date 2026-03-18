const Book = require('../models/Book');
const BorrowRecord = require('../models/BorrowRecord');
const Category = require('../models/Category');
const User = require('../models/User');

class RecommendationService {
  
  /**
   * Get comprehensive recommendations combining all strategies
   * @param {string} userId - User ID
   * @param {Object} options - Recommendation options
   * @returns {Promise<Object>} - Combined recommendations with different strategies
   */
  async getComprehensiveRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        includePersonalized = true,
        includePopular = true,
        includeSemester = true,
        includeCollaborative = true,
        includeCategory = true
      } = options;

      const recommendations = {};

      // Get user information
      const user = await User.findById(userId);
      const currentSemester = this.getCurrentSemester();

      // 1. Personalized recommendations based on user history
      if (includePersonalized) {
        recommendations.personalized = await this.getRecommendationsForUser(userId, Math.ceil(limit / 2));
      }

      // 2. Popular books
      if (includePopular) {
        recommendations.popular = await this.getPopularBooks(Math.ceil(limit / 2));
      }

      // 3. Semester-based recommendations
      if (includeSemester) {
        recommendations.semester = await this.getSemesterBasedRecommendations(userId, Math.ceil(limit / 2));
      }

      // 4. Collaborative filtering
      if (includeCollaborative) {
        recommendations.collaborative = await this.getCollaborativeRecommendations(userId, Math.ceil(limit / 2));
      }

      // 5. Category-based recommendations
      if (includeCategory) {
        recommendations.category = await this.getAcademicProgressRecommendations(userId, Math.ceil(limit / 2));
      }

      // Add metadata
      recommendations.metadata = {
        userId,
        semester: currentSemester,
        userDepartment: user?.department || 'General',
        userRole: user?.role || 'student',
        generatedAt: new Date().toISOString(),
        strategies: Object.keys(recommendations).filter(key => key !== 'metadata')
      };

      return recommendations;
    } catch (error) {
      console.error('Error in getComprehensiveRecommendations:', error);
      throw error;
    }
  }

  /**
   * Get recommendations based on user's borrowing history
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getRecommendationsForUser(userId, limit = 10) {
    try {
      // Get user's borrowing history
      const borrowHistory = await BorrowRecord.find({ 
        userId: userId,
        status: 'returned'
      })
      .populate('bookId')
      .sort({ returnDate: -1 })
      .limit(20);

      if (borrowHistory.length === 0) {
        return await this.getPopularBooks(limit);
      }

      // Extract categories from user's borrowing history
      const userCategories = borrowHistory.map(record => record.bookId.category);
      const uniqueCategories = [...new Set(userCategories)];

      // Get books from same categories
      const recommendations = await Book.find({
        category: { $in: uniqueCategories },
        _id: { $nin: borrowHistory.map(record => record.bookId._id) },
        status: 'available'
      })
      .populate('category', 'name code')
      .limit(limit)
      .sort({ createdAt: -1 });

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
   * Get popular books based on borrow count
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Array of popular books
   */
  async getPopularBooks(limit = 10) {
    try {
      const popularBooks = await BorrowRecord.aggregate([
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
          $sort: { borrowCount: -1 }
        },
        {
          $limit: limit
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
        },
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
        }
      ]);

      return popularBooks;
    } catch (error) {
      console.error('Error in getPopularBooks:', error);
      throw error;
    }
  }

  /**
   * Get recommendations based on user's most frequently borrowed categories
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getRecommendationsByUserCategories(userId, limit = 10) {
    try {
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
        return await this.getPopularBooks(limit);
      }

      const topCategories = categoryFrequency.map(cat => cat._id);

      // Get books from top categories that user hasn't borrowed
      const userBorrowedBooks = await BorrowRecord.find({
        userId: userId,
        status: { $in: ['returned', 'approved'] }
      }).distinct('bookId');

      const recommendations = await Book.find({
        category: { $in: topCategories },
        _id: { $nin: userBorrowedBooks },
        status: 'available'
      })
      .populate('category', 'name code')
      .limit(limit)
      .sort({ createdAt: -1 });

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
   * Get recommendations based on users with similar borrowing patterns
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getCollaborativeRecommendations(userId, limit = 10) {
    try {
      // Get user's borrowed books
      const userBooks = await BorrowRecord.find({
        userId: userId,
        status: 'returned'
      }).distinct('bookId');

      if (userBooks.length === 0) {
        return await this.getRecommendationsByUserCategories(userId, limit);
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
        return await this.getRecommendationsByUserCategories(userId, limit);
      }

      const similarUserIds = similarUsers.map(user => user._id);

      // Get books borrowed by similar users that current user hasn't borrowed
      const recommendations = await BorrowRecord.aggregate([
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
          $sort: { recommendationScore: -1 }
        },
        {
          $limit: limit
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
        },
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
        }
      ]);

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
   * Get semester-based recommendations for user
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getSemesterBasedRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId);
      const currentSemester = this.getCurrentSemester();
      
      // Get user's department and estimated year based on account creation
      const userDepartment = user?.department || 'General';
      const accountAge = this.calculateUserYear(user.createdAt);
      
      // Define semester-specific categories
      const semesterCategories = this.getSemesterCategories(currentSemester.semester);
      
      // Get books from semester-appropriate categories
      const recommendations = await Book.find({
        category: { $in: semesterCategories },
        status: 'available'
      })
      .populate('category', 'name code')
      .limit(limit)
      .sort({ createdAt: -1 });

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
   * Get recommendations based on user's academic progress
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getAcademicProgressRecommendations(userId, limit = 10) {
    try {
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
      
      // Get recommendations
      const recommendations = await Book.find({
        category: { $in: appropriateCategories },
        status: 'available',
        _id: { $nin: borrowHistory.map(record => record.bookId._id) }
      })
      .populate('category', 'name code')
      .limit(limit)
      .sort({ createdAt: -1 });

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
}

module.exports = new RecommendationService();
