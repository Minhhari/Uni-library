const cron = require('node-cron');
const BorrowRecord = require('../models/BorrowRecord');
const Book = require('../models/Book');
const notificationService = require('./notificationService');

// Check expired pickups every day at midnight
const checkExpiredPickups = async () => {
  try {
    console.log('🔍 Checking expired pickup requests...');
    
    const expiredRequests = await BorrowRecord.find({
      status: "waiting_for_pickup",
      pickupDeadline: { $lt: new Date() }
    }).populate('bookId userId');

    if (expiredRequests.length === 0) {
      console.log('✅ No expired pickup requests found');
      return;
    }

    console.log(`📚 Found ${expiredRequests.length} expired pickup requests`);

    for (const record of expiredRequests) {
      // ✅ CÔNG LẠI SÁCH
      await Book.findByIdAndUpdate(record.bookId._id, {
        $inc: { available: 1 }
      });

      // Update record
      await BorrowRecord.findByIdAndUpdate(record._id, {
        status: "expired",
        pickupExpiredAt: new Date()
      });

      // Gửi thông báo cho student
      await notificationService.createNotification(
        record.userId._id,
        "Yêu cầu mượn sách đã hết hạn",
        `Yêu cầu mượn sách "${record.bookId.title}" đã hết hạn vì bạn không đến nhận trong 3 ngày.`,
        "/my-activity"
      );

      console.log(`⏰ Expired request for book: ${record.bookId.title}`);
    }

    console.log(`✅ Processed ${expiredRequests.length} expired requests`);
  } catch (error) {
    console.error('❌ Error checking expired pickups:', error);
  }
};

// Schedule to run every day at 00:00
cron.schedule('0 0 * * *', checkExpiredPickups);

// Also run immediately on server start
setTimeout(checkExpiredPickups, 5000);

module.exports = {
  checkExpiredPickups
};
