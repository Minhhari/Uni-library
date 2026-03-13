const express = require("express");
const router = express.Router();

const borrowController = require("../controllers/borrowController");
const auth = require("../middleware/auth");

// student request
router.post("/request", auth, borrowController.requestBorrow);

// student view
router.get("/my-books", auth, borrowController.getMyBooks);

// librarian view all
router.get("/all", auth, borrowController.getAllBorrows);

// librarian approve
router.put("/approve/:id", auth, borrowController.approveBorrow);

// librarian reject
router.put("/reject/:id", auth, borrowController.rejectBorrow);

// return book
router.put("/return/:id", auth, borrowController.returnBook);

module.exports = router;