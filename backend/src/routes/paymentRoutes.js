const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

router.post("/create", protect, paymentController.createPayment);
router.post("/webhook", paymentController.handleWebhook);
router.get("/verify/:orderCode", protect, paymentController.verifyPayment);
router.get("/:orderCode", protect, paymentController.getPaymentStatus);

module.exports = router;