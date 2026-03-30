const Notification = require('../models/Notification');

// @desc    Get all notifications for the logged in user
// @route   GET /notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount: notifications.filter(n => !n.isRead).length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể tải thông báo' });
    }
};

// @desc    Mark a notification as read
// @route   PUT /notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
        }
        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể đánh dấu đã đọc' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể đánh dấu tất cả đã đọc' });
    }
};

// @desc    Delete a notification
// @route   DELETE /notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
        }
        res.status(200).json({ success: true, message: 'Đã xóa thông báo' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Xóa thông báo thất bại' });
    }
};
