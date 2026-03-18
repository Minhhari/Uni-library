const Book = require('../models/Book');
const BorrowRecord = require('../models/BorrowRecord');
const Category = require('../models/Category');

class RecommendationService {
  
  /**
   * Get recommendations based on user's borrowing history
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of recommended books
   */
  async getRecommendationsForUser(userId) {
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
        return await this.getPopularBooks(10);
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
      .limit(15)
      .sort({ createdAt: -1 });

      return recommendations;
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
                  borrowCount: '$borrowCount'
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
   * Get similar books based on book ID
   * @param {string} bookId - Book ID
   * @returns {Promise<Array>} - Array of similar books
   */
  async getSimilarBooks(bookId) {
    try {
      // TODO: Implement content-based similarity
      console.log('Getting similar books for:', bookId);
      return [];
    } catch (error) {
      console.error('Error in getSimilarBooks:', error);
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
            userId: mongoose.Types.ObjectId(userId),
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

      return recommendations;
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
        return await this.getPopularBooks(limit);
      }

      // Find users who borrowed similar books
      const similarUsers = await BorrowRecord.aggregate([
        {
          $match: {
            bookId: { $in: userBooks },
            status: 'returned',
            userId: { $ne: mongoose.Types.ObjectId(userId) }
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
                  recommendationScore: '$recommendationScore'
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
}

module.exports = new RecommendationService();
