const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Tạo thông báo cho một người dùng cụ thể
 * @param {string} userId - ID người nhận
 * @param {string} title - Tiêu đề thông báo
 * @param {string} message - Nội dung chi tiết
 * @param {string} link - Link FE (ví dụ: /profile/fines)
 */
const createNotification = async (userId, title, message, link = null) => {
    try {
        const notification = await Notification.create({
            userId,
            title,
            message,
            link
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

/**
 * Gửi thông báo cho tất cả thủ thư (Librarian) đang hoạt động
 * @param {string} title - Tiêu đề
 * @param {string} message - Nội dung
 * @param {string} link - Link trang quản lý của Librarian
 */
const notifyLibrarians = async (title, message, link = null) => {
    try {
        const librarians = await User.find({ role: 'librarian', isActive: true });
        if (librarians.length > 0) {
            const notifications = librarians.map(lib => ({
                userId: lib._id,
                title,
                message,
                link
            }));
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Error notifying librarians:', error);
    }
};

/**
 * Gửi thông báo cho tất cả Admin đang hoạt động
 * @param {string} title 
 * @param {string} message 
 * @param {string} link 
 */
const notifyAdmins = async (title, message, link = null) => {
    try {
        const admins = await User.find({ role: 'admin', isActive: true });
        if (admins.length > 0) {
            const notifications = admins.map(adm => ({
                userId: adm._id,
                title,
                message,
                link
            }));
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
};

module.exports = {
    createNotification,
    notifyLibrarians,
    notifyAdmins
};
