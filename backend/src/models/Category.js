const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parent_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for search functionality
categorySchema.index({ name: 'text', code: 'text' });

// Pre-save middleware to generate code from name if not provided
categorySchema.pre('save', function(next) {
  if (!this.code && this.name) {
    this.code = this.name.toUpperCase().replace(/\s+/g, '_');
  }
  next();
});

module.exports = mongoose.model("Category", categorySchema);
