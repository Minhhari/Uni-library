const Book = require('../models/Book');
const BorrowRecord = require('../models/BorrowRecord');
const Category = require('../models/Category');

class RecommendationService {
  
  /**
   * Get recommendations based on category
   * @param {string} categoryId - Category ID
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Array of books in the same category
   */
  async getCategoryBasedRecommendations(categoryId, limit = 10) {
    try {
      const books = await Book.find({ 
        category: categoryId,
        status: 'available'
      })
      .populate('category', 'name code')
      .limit(limit)
      .sort({ createdAt: -1 });

      return books.map(book => ({
        ...book.toObject(),
        recommendationReason: `Recommended from ${book.category.name} category`,
        strategy: 'category-based'
      }));
    } catch (error) {
      console.error('Error in getCategoryBasedRecommendations:', error);
      throw error;
    }
  }

  /**
   * Get recommendations for multiple categories
   * @param {Array} categoryIds - Array of Category IDs
   * @param {number} limit - Number of recommendations per category
   * @returns {Promise<Array>} - Array of recommended books grouped by category
   */
  async getMultiCategoryRecommendations(categoryIds, limit = 5) {
    try {
      const recommendations = await Promise.all(
        categoryIds.map(async (categoryId) => {
          const books = await Book.find({ 
            category: categoryId,
            status: 'available'
          })
          .populate('category', 'name code')
          .limit(limit)
          .sort({ createdAt: -1 });

          return {
            categoryId,
            categoryName: books[0]?.category?.name || 'Unknown',
            books: books.map(book => ({
              ...book.toObject(),
              recommendationReason: `Recommended from ${books[0]?.category?.name || 'Unknown'} category`,
              strategy: 'category-based'
            }))
          };
        })
      );

      return recommendations;
    } catch (error) {
      console.error('Error in getMultiCategoryRecommendations:', error);
      throw error;
    }
  }

  /**
   * Get trending books within a category
   * @param {string} categoryId - Category ID
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - Array of trending books in category
   */
  async getTrendingBooksByCategory(categoryId, limit = 10) {
    try {
      // Get books with most borrows in this category
      const trendingBooks = await BorrowRecord.aggregate([
        {
          $match: {
            bookId: { $exists: true },
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
          $match: {
            'bookInfo.category': categoryId,
            'bookInfo.status': 'available'
          }
        },
        {
          $group: {
            _id: '$bookId',
            borrowCount: { $sum: 1 },
            bookInfo: { $first: '$bookInfo' }
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
                  recommendationReason: `Trending in ${'$categoryInfo.name'} category`,
                  strategy: 'category-trending'
                }
              ]
            }
          }
        }
      ]);

      return trendingBooks;
    } catch (error) {
      console.error('Error in getTrendingBooksByCategory:', error);
      throw error;
    }
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
}

module.exports = new RecommendationService();
