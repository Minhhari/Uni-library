const cron = require('node-cron');
const BorrowRecord = require('../models/BorrowRecord');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const notificationService = require('./notificationService');

// ═══════════════════════════════════════════════════════════
// 1. Check expired pickups — chuyển status sang "expired"
// ═══════════════════════════════════════════════════════════
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
      // Cộng lại sách
      await Book.findByIdAndUpdate(record.bookId._id, {
        $inc: { available: 1 }
      });

      // Update record
      await BorrowRecord.findByIdAndUpdate(record._id, {
        status: "expired",
        pickupExpiredAt: new Date()
      });

      // Gửi thông báo cho user
      await notificationService.createNotification(
        record.userId._id,
        "Yêu cầu mượn sách đã hết hạn",
        `Yêu cầu mượn sách "${record.bookId.title}" đã hết hạn vì bạn không đến nhận trong thời gian quy định.`,
        "/my-activity"
      );

      console.log(`⏰ Expired request for book: ${record.bookId.title}`);
    }

    console.log(`✅ Processed ${expiredRequests.length} expired requests`);
  } catch (error) {
    console.error('❌ Error checking expired pickups:', error);
  }
};

// ═══════════════════════════════════════════════════════════
// 2. Nhắc nhở người dùng nhận sách khi còn 2 ngày
//    (Reserve Book được duyệt, 5 ngày để nhận, ngày 3 nhắc)
// ═══════════════════════════════════════════════════════════
const remindPickups = async () => {
  try {
    console.log('🔔 Checking for pickup reminders...');
    const now = new Date();

    // Tìm reservations được approved mà expiresAt còn đúng 2 ngày nữa
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const startOfDay = new Date(twoDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(twoDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    // Reservation reminders
    const reservations = await Reservation.find({
      status: 'approved',
      expiresAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('bookId');

    for (const rsv of reservations) {
      if (rsv.bookId) {
        await notificationService.createNotification(
          rsv.userId,
          'Nhắc nhở nhận sách đặt trước',
          `Bạn còn 2 ngày nữa để đến nhận sách "${rsv.bookId.title}". Vui lòng đến thư viện để nhận sách trước ngày ${rsv.expiresAt.toLocaleDateString('vi-VN')}.`,
          '/my-activity'
        );
      }
    }

    // BorrowRecord reminders (waiting_for_pickup)
    const borrowRecords = await BorrowRecord.find({
      status: 'waiting_for_pickup',
      pickupDeadline: { $gte: startOfDay, $lte: endOfDay }
    }).populate('bookId');

    for (const record of borrowRecords) {
      if (record.bookId) {
        await notificationService.createNotification(
          record.userId,
          'Nhắc nhở nhận sách mượn',
          `Bạn còn 2 ngày nữa để đến nhận sách "${record.bookId.title}". Vui lòng đến thư viện để nhận sách trước ngày ${record.pickupDeadline.toLocaleDateString('vi-VN')}.`,
          '/my-activity'
        );
      }
    }

    console.log(`🔔 Sent reminders: ${reservations.length} reservations, ${borrowRecords.length} borrows`);
  } catch (error) {
    console.error('❌ Error sending pickup reminders:', error);
  }
};

// ═══════════════════════════════════════════════════════════
// Schedule cron jobs
// ═══════════════════════════════════════════════════════════

// Chạy mỗi ngày lúc 00:00 — xử lý hết hạn
cron.schedule('0 0 * * *', checkExpiredPickups);

// Chạy mỗi ngày lúc 08:00 — nhắc nhở nhận sách
cron.schedule('0 8 * * *', remindPickups);

// Chạy checkExpiredPickups ngay khi server khởi động (delay 5s)
setTimeout(checkExpiredPickups, 5000);

module.exports = {
  checkExpiredPickups,
  remindPickups
};
