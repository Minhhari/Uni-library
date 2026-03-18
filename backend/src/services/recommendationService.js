const Book = require('../models/Book');
const BorrowRecord = require('../models/BorrowRecord');
const Category = require('../models/Category');
const User = require('../models/User');

class RecommendationService {
  
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

  /**
   * Get trending books for current semester
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Array of trending books
   */
  async getSemesterTrendingBooks(limit = 10) {
    try {
      const currentSemester = this.getCurrentSemester();
      const semesterStart = this.getSemesterStartDate(currentSemester.semester);
      
      const trendingBooks = await BorrowRecord.aggregate([
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
                  semester: currentSemester.semester,
                  recommendationReason: `Trending in ${currentSemester.semesterName}`,
                  strategy: 'semester-trending'
                }
              ]
            }
          }
        }
      ]);

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
}

module.exports = new RecommendationService();
