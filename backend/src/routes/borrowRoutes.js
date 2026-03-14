const express = require("express");
const router = express.Router();

const borrowController = require("../controllers/borrowController");
const { protect } = require('../middleware/authMiddleware');

// student request
router.post("/request", protect, borrowController.requestBorrow);
// student view
router.get("/my-books", protect, borrowController.getMyBooks);

// librarian view all
router.get("/all", protect, borrowController.getAllBorrows);

// librarian approve
router.put("/approve/:id", protect, borrowController.approveBorrow);

// librarian reject
router.put("/reject/:id", protect, borrowController.rejectBorrow);

// return book
router.put("/return/:id", protect, borrowController.returnBook);

module.exports = router;