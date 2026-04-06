const Book = require('../models/Book');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');

// @desc    Get all categories
// @route   GET /api/books/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error when fetching categories' });
  }
};

// @desc    Get book counts grouped by shelf location
// @route   GET /api/books/shelf-stats
// @access  Public
exports.getShelfStats = async (req, res) => {
  try {
    const stats = await Book.aggregate([
      { $match: { location: { $exists: true, $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$location',
          bookCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    const map = {};
    stats.forEach(s => { map[s._id] = { bookCount: s.bookCount, totalQuantity: s.totalQuantity }; });
    res.status(200).json({ success: true, data: map });
  } catch (error) {
    console.error('Error getting shelf stats:', error);
    res.status(500).json({ success: false, message: 'Server error when fetching shelf stats' });
  }
};

// @desc    Get all books with pagination, search, and filter
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by author
    if (req.query.author) {
      query.author = { $regex: req.query.author, $options: 'i' };
    }

    // Filter by publisher
    if (req.query.publisher) {
      query.publisher = { $regex: req.query.publisher, $options: 'i' };
    }

    // Filter by publish year range
    if (req.query.year_from || req.query.year_to) {
      query.publish_year = {};
      if (req.query.year_from) query.publish_year.$gte = parseInt(req.query.year_from);
      if (req.query.year_to) query.publish_year.$lte = parseInt(req.query.year_to);
    }

    // Filter by location (shelf) — used by LibraryMap ShelfPanel
    if (req.query.location) {
      query.location = req.query.location;
    }

    // Filter by availability
    if (req.query.available === 'true') {
      query.available = { $gt: 0 };
      query.status = 'available';
    }

    // Sort options
    let sort = {};
    if (req.query.sort) {
      const sortField = req.query.sort;
      const sortOrder = req.query.order === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      sort.createdAt = -1; // Default sort by newest
    }

    // Execute query with pagination
    const books = await Book.find(query)
      .populate('category', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Book.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      data: books
    });
  } catch (error) {
    console.error('Error getting books:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when fetching books',
      error: error.message
    });
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('category', 'name description');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Error getting book:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when fetching book',
      error: error.message
    });
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Admin, Librarian)
exports.createBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      title,
      author,
      category,
      isbn,
      publisher,
      publish_year,
      description,
      cover_image,
      previewImages,
      quantity,
      location
    } = req.body;

    // Check if ISBN already exists
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Create book
    const book = await Book.create({
      title,
      author,
      category,
      isbn,
      publisher,
      publish_year,
      description,
      cover_image,
      previewImages,
      quantity,
      available: quantity, // Initially all books are available
      location
    });

    const populatedBook = await Book.findById(book._id).populate('category', 'name code');

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: populatedBook
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when creating book',
      error: error.message
    });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin, Librarian)
exports.updateBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const {
      title,
      author,
      category,
      isbn,
      publisher,
      publish_year,
      description,
      cover_image,
      previewImages,
      quantity,
      location,
      status
    } = req.body;

    // Check if ISBN already exists (excluding current book)
    if (isbn && isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        return res.status(400).json({
          success: false,
          message: 'Book with this ISBN already exists'
        });
      }
    }

    // Check if category exists
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Update book
    const updateData = {
      title,
      author,
      category,
      isbn,
      publisher,
      publish_year,
      description,
      cover_image,
      previewImages,
      quantity,
      location,
      status
    };

    // If quantity is being updated, adjust available count
    if (quantity !== undefined && quantity !== book.quantity) {
      const availableDifference = quantity - book.quantity;
      updateData.available = Math.max(0, book.available + availableDifference);
    }

    book = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name code');

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: book
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when updating book',
      error: error.message
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book has borrowed copies
    if (book.available < book.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book. Some copies are currently borrowed.'
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when deleting book',
      error: error.message
    });
  }
};

// @desc    Update book quantity (for tracking)
// @route   PUT /api/books/:id/quantity
// @access  Private (Admin, Librarian)
exports.updateBookQuantity = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity'
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    let newQuantity = book.quantity;
    let newAvailable = book.available;

    switch (operation) {
      case 'add':
        newQuantity += quantity;
        newAvailable += quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, newQuantity - quantity);
        newAvailable = Math.max(0, newAvailable - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        newAvailable = Math.min(newAvailable, quantity);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation. Use: add, subtract, or set'
        });
    }

    book.quantity = newQuantity;
    book.available = newAvailable;
    await book.save();

    res.status(200).json({
      success: true,
      message: 'Book quantity updated successfully',
      data: book
    });
  } catch (error) {
    console.error('Error updating book quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when updating book quantity',
      error: error.message
    });
  }
};

// @desc    Bulk add books via frontend JSON array
// @route   POST /api/books/bulk-import
// @access  Private (Admin, Librarian)
exports.bulkAddBooks = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách sách trống.' });
    }
    const results = [];
    const failures = [];

    for (const item of items) {
      const { title, author, isbn, publisher, publish_year, quantity, categoryName, price, location } = item;
      try {
        if (!title || price === undefined || !location) {
          failures.push({ title: title || 'N/A', reason: 'Thiếu thông tin bắt buộc (Tên sách, Giá, Vị trí).' });
          continue;
        }

        // Normalize location
        const locStr = location.trim().toUpperCase().replace(/K[ÊE]\s*/gi, '').trim();
        const match = locStr.match(/^([A-G])(\d+)$/);
        const normalizedLocation = match ? `Kệ ${match[1]}${match[2]}` : location.trim();

        let categoryId = null;
        if (categoryName) {
          let cat = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } });
          if (!cat) {
            const code = categoryName.toUpperCase().replace(/\s+/g, '_');
            cat = await Category.create({ name: categoryName, code });
          }
          categoryId = cat._id;
        }

        let cover_image = '';
        if (isbn) {
          cover_image = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        }

        let bookDoc = null;
        let action = 'created';

        if (isbn) {
          bookDoc = await Book.findOne({ isbn });
        }

        if (bookDoc) {
          bookDoc.quantity += (quantity || 1);
          bookDoc.available += (quantity || 1);
          if (price > 0) bookDoc.price = price;
          if (cover_image) bookDoc.cover_image = cover_image;
          bookDoc.location = normalizedLocation;
          await bookDoc.save();
          action = 'updated';
        } else {
          const newBookData = {
            title,
            author: author || 'Chưa xác định',
            isbn: isbn || `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            publisher: publisher || 'Chưa xác định',
            publish_year: publish_year || new Date().getFullYear(),
            quantity: quantity || 1,
            available: quantity || 1,
            price,
            location: normalizedLocation,
            cover_image,
            status: 'available',
          };
          if (categoryId) newBookData.category = categoryId;
          bookDoc = await Book.create(newBookData);
        }

        results.push({ title, action });
      } catch (err) {
        failures.push({ title: title || 'N/A', reason: err.message });
      }
    }

    res.status(200).json({
      success: true,
      data: { imported: results.length, failed: failures.length, results, failures }
    });
  } catch (error) {
    console.error('Error bulk adding books:', error);
    res.status(500).json({ success: false, message: 'Nhập sách hàng loạt thất bại' });
  }
};
