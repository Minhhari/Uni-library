const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  category: String,
  isbn: String,
  publisher: String,
  publish_year: Number,
  quantity: Number,
  available: Number
});

module.exports = mongoose.model("Book", bookSchema);