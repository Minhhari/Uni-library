const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');
const BorrowRecord = require('../models/BorrowRecord');
const Fine = require('../models/Fine');

// Default settings seeded on first fetch
const DEFAULT_SETTINGS = [
    {
        key: 'maxLoanDays',
        value: 14,
        label: 'Max Loan Duration',
        description: 'Maximum number of days a user can borrow a book',
        type: 'number',
        unit: 'days',
    },
    {
        key: 'finePerDay',
        value: 5000,
        label: 'Fine per Overdue Day',
        description: 'Amount charged per day for overdue books',
        type: 'number',
        unit: 'VND/day',
    },
    {
        key: 'maxBooksPerUser',
        value: 5,
        label: 'Max Books Per User',
        description: 'Maximum number of books a user can borrow at once',
        type: 'number',
        unit: 'books',
    },
    {
        key: 'maxReservationsPerUser',
        value: 3,
        label: 'Max Reservations Per User',
        description: 'Maximum number of active reservations per user',
        type: 'number',
        unit: 'reservations',
    },
    {
        key: 'reservationExpiryDays',
        value: 3,
        label: 'Reservation Expiry',
        description: 'Days before an unclaimed reservation expires',
        type: 'number',
        unit: 'days',
    },
];

// ─── GET /admin/settings ────────────────────────────────────────────────
const getSettings = async (req, res) => {
    try {
        // Seed defaults if empty
        const count = await SystemSetting.countDocuments();
        if (count === 0) {
            await SystemSetting.insertMany(DEFAULT_SETTINGS);
        }

        const settings = await SystemSetting.find().sort({ key: 1 });
        return res.status(200).json({ success: true, settings });
    } catch (error) {
        console.error('Get settings error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── PUT /admin/settings/:key ────────────────────────────────────────────
const upsertSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined || value === null) {
            return res.status(400).json({ success: false, message: 'Value is required.' });
        }

        const setting = await SystemSetting.findOneAndUpdate(
            { key },
            { $set: { value, updatedBy: req.user._id } },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Setting updated.',
            setting,
        });
    } catch (error) {
        console.error('Upsert setting error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── GET /admin/stats ────────────────────────────────────────────────────
const getAdminStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalStudents,
            totalLecturers,
            totalLibrarians,
            activeUsers,
            totalBorrows,
            activeBorrows,
            returnedBorrows,
            overdueBorrows,
            totalFines,
            paidFines,
            pendingFines,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'lecturer' }),
            User.countDocuments({ role: 'librarian' }),
            User.countDocuments({ isActive: true }),
            BorrowRecord.countDocuments(),
            BorrowRecord.countDocuments({ status: 'approved' }),
            BorrowRecord.countDocuments({ status: 'returned' }),
            BorrowRecord.countDocuments({
                status: 'approved',
                dueDate: { $lt: new Date() },
            }),
            Fine.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
            Fine.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Fine.aggregate([
                { $match: { status: 'pending' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);

        // Monthly new users (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyUsers = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Monthly borrows (last 6 months)
        const monthlyBorrows = await BorrowRecord.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    students: totalStudents,
                    lecturers: totalLecturers,
                    librarians: totalLibrarians,
                },
                borrows: {
                    total: totalBorrows,
                    active: activeBorrows,
                    returned: returnedBorrows,
                    overdue: overdueBorrows,
                },
                fines: {
                    total: totalFines[0]?.total || 0,
                    paid: paidFines[0]?.total || 0,
                    pending: pendingFines[0]?.total || 0,
                },
                charts: {
                    monthlyUsers,
                    monthlyBorrows,
                },
            },
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getSettings, upsertSetting, getAdminStats };
