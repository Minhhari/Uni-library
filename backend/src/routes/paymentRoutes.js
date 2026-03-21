const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/create", paymentController.createPayment);
router.post("/webhook", paymentController.handleWebhook);
router.get("/:orderCode", paymentController.getPaymentStatus);

module.exports = router;