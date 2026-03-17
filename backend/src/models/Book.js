const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    publisher: {
      type: String,
      required: true,
      trim: true,
    },
    publish_year: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cover_image: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    available: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "unavailable", "maintenance"],
      default: "available",
    },
  },
  {
    timestamps: true,
  },
);

// Index for search functionality
bookSchema.index({ title: "text", author: "text", isbn: "text" });

// Virtual to check if book is available for borrowing
bookSchema.virtual("isAvailable").get(function () {
  return this.available > 0 && this.status === "available";
});

// Pre-save middleware to ensure available <= quantity
bookSchema.pre("save", function (next) {
  if (this.available > this.quantity) {
    this.available = this.quantity;
  }
  next();
});

module.exports = mongoose.model("Book", bookSchema);
