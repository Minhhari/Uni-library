const express = require("express");
const router = express.Router();
const Fine = require("../models/Fine");

// tạo fine test
router.post("/create", async (req, res) => {
  try {
    const fine = await Fine.create(req.body);
    res.json(fine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;