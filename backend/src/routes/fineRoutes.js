const express = require("express");
const router = express.Router();
const Fine = require("../models/Fine");
const fineController = require("../controllers/fineController");
const { protect, authorize } = require("../middleware/authMiddleware");

// GET /fines/my  - Student: get their own fines
router.get("/my", protect, fineController.getMyFines);

// GET /fines/all - Librarian/Admin: get all fines
router.get("/all", protect, authorize("admin", "librarian"), fineController.getAllFines);

// POST /fines/create - test route (create fine manually)
router.post("/create", async (req, res) => {
  try {
    const fine = await Fine.create(req.body);
    res.json(fine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;