const payOS = require("../config/payos");
const Fine = require("../models/Fine");
const notificationService = require("../services/notificationService");

// =======================
// CREATE PAYMENT
// =======================
exports.createPayment = async (req, res) => {
  try {
    const { fineId } = req.body;

    const fine = await Fine.findById(fineId);

    if (!fine) {
      return res.status(404).json({ message: "Fine not found" });
    }

    if (fine.status === "paid") {
      return res.status(400).json({ message: "Fine already paid" });
    }

    if (fine.amount <= 0) {
      return res.status(400).json({ message: "Invalid fine amount" });
    }

    // 🔥 tránh tạo nhiều orderCode
    if (!fine.orderCode) {
      fine.orderCode = Date.now();
      await fine.save();
    }

    const desc = `Fine:${fine.reason}`.substring(0, 25); // PayOS max 25 chars

    const paymentData = {
      orderCode: fine.orderCode,
      amount: fine.amount,
      description: desc,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?orderCode=${fine.orderCode}`,
      cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/transactions`,
      items: [
        {
          name: `Fine-${fine.reason}`.substring(0, 50), // PayOS max 50 chars
          quantity: 1,
          price: fine.amount,
        },
      ],
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
    };

    const paymentLink = await payOS.paymentRequests.create(paymentData);

    res.json({
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode: fine.orderCode,
      fineId: fine._id,
    });

  } catch (err) {
    console.error("Create payment error:", err?.response?.data || err.message || err);
    res.status(500).json({
      message: "Create payment failed",
      error: err?.response?.data?.desc || err.message,
    });
  }
};

// =======================
// HANDLE WEBHOOK
// =======================
exports.handleWebhook = async (req, res) => {
  try {
    const webhookData = req.body;

    const isValid = payOS.webhooks.verifySignature(webhookData);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const { code, data } = webhookData;
    const orderCode = data?.orderCode;

    if (!orderCode) {
      return res.status(400).json({ message: "Missing orderCode" });
    }

    const fine = await Fine.findOne({ orderCode });

    if (!fine) {
      console.log("Fine not found:", orderCode);
      return res.json({ message: "OK" });
    }

    // 🔥 tránh xử lý lại
    if (fine.status === "paid") {
      return res.json({ message: "Already processed" });
    }

    if (code === "00") {
      fine.status = "paid";
      fine.paidAt = new Date();

      // Gửi thông báo cho sinh viên
      await notificationService.createNotification(
        fine.userId,
        "Thanh toán phí phạt thành công",
        `Bạn đã thanh toán thành công phí phạt ${fine.amount.toLocaleString()}đ cho lý do: ${fine.reason}.`,
        "/profile?tab=fines"
      );

      console.log(`✅ Payment SUCCESS: ${orderCode}`);
    } else {
      fine.status = "pending";
      console.log(`❌ Payment FAILED: ${orderCode}`);
    }

    await fine.save();

    res.json({ message: "Webhook processed" });

  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ message: "Webhook error" });
  }
};

// =======================
// GET PAYMENT STATUS
// =======================
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderCode } = req.params;

    const paymentInfo = await payOS.paymentRequests.get(orderCode);

    res.json(paymentInfo);

  } catch (err) {
    console.error("Get payment status error:", err);
    res.status(500).json({
      message: "Cannot get payment status",
    });
  }
};

// =======================
// VERIFY & CONFIRM PAYMENT (called by frontend after PayOS redirect)
// Works even on localhost — no webhook needed.
// =======================
exports.verifyPayment = async (req, res) => {
  try {
    const { orderCode } = req.params;

    // 1. Find the fine in our DB
    const fine = await Fine.findOne({ orderCode: Number(orderCode) });
    if (!fine) {
      return res.status(404).json({ message: "Fine not found for this orderCode" });
    }

    // Already paid — return success immediately
    if (fine.status === "paid") {
      return res.json({ success: true, status: "paid", message: "Fine already marked as paid." });
    }

    // 2. Ask PayOS for the real payment status
    const paymentInfo = await payOS.paymentRequests.get(Number(orderCode));

    // PayOS returns status: 'PAID' | 'PENDING' | 'CANCELLED' | 'EXPIRED'
    if (paymentInfo.status === "PAID") {
      fine.status = "paid";
      fine.paidAt = new Date();
      await fine.save();

      // Notify the student
      try {
        await notificationService.createNotification(
          fine.userId,
          "Thanh toán phí phạt thành công",
          `Bạn đã thanh toán thành công phí phạt ${fine.amount.toLocaleString()}đ cho lý do: ${fine.reason}.`,
          "/transactions"
        );
      } catch (notifErr) {
        console.warn("Notification failed (non-critical):", notifErr.message);
      }

      console.log(`✅ Payment VERIFIED & CONFIRMED: orderCode=${orderCode}`);
      return res.json({ success: true, status: "paid", message: "Payment confirmed successfully!" });
    } else {
      return res.json({ success: false, status: paymentInfo.status, message: `Payment status: ${paymentInfo.status}` });
    }

  } catch (err) {
    console.error("Verify payment error:", err?.response?.data || err.message || err);
    res.status(500).json({
      message: "Failed to verify payment",
      error: err?.response?.data?.desc || err.message,
    });
  }
};