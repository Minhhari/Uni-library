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

// ─── GET /api/users/settings/public ──────────────────────────────────────
const getPublicSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.find({ key: { $in: ['maxLoanDays', 'reservationExpiryDays', 'maxBooksPerUser', 'maxReservationsPerUser'] } });

        const publicConfig = {};
        settings.forEach(s => {
            publicConfig[s.key] = s.value;
        });

        // Add defaults if missing
        if (!publicConfig.maxLoanDays) publicConfig.maxLoanDays = 70; // 10 weeks
        if (!publicConfig.reservationExpiryDays) publicConfig.reservationExpiryDays = 3;

        return res.status(200).json({ success: true, settings: publicConfig });
    } catch (error) {
        console.error('Get public settings error:', error);
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
        const { period } = req.query;
        let dateFilter = {};
        let fineDateFilter = {};

        if (period === 'today') {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { $gte: start } };
            const mongoose = require('mongoose');
            fineDateFilter = { _id: { $gte: mongoose.Types.ObjectId.createFromTime(Math.floor(start.getTime() / 1000)) } };
        } else if (period === 'week') {
            const start = new Date();
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { $gte: start } };
            const mongoose = require('mongoose');
            fineDateFilter = { _id: { $gte: mongoose.Types.ObjectId.createFromTime(Math.floor(start.getTime() / 1000)) } };
        } else if (period === 'month') {
            const start = new Date();
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { $gte: start } };
            const mongoose = require('mongoose');
            fineDateFilter = { _id: { $gte: mongoose.Types.ObjectId.createFromTime(Math.floor(start.getTime() / 1000)) } };
        } else if (period === 'year') {
            const start = new Date();
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            dateFilter = { createdAt: { $gte: start } };
            const mongoose = require('mongoose');
            fineDateFilter = { _id: { $gte: mongoose.Types.ObjectId.createFromTime(Math.floor(start.getTime() / 1000)) } };
        }

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
            User.countDocuments(dateFilter),
            User.countDocuments({ role: 'student', ...dateFilter }),
            User.countDocuments({ role: 'lecturer', ...dateFilter }),
            User.countDocuments({ role: 'librarian', ...dateFilter }),
            // active users usually snapshot, we'll just show active users registered in period
            User.countDocuments({ isActive: true, ...dateFilter }),
            BorrowRecord.countDocuments(dateFilter),
            // statuses can be point-in-time, we'll apply filter anyway for consistency
            BorrowRecord.countDocuments({ status: 'approved', ...dateFilter }),
            BorrowRecord.countDocuments({ status: 'returned', ...dateFilter }),
            BorrowRecord.countDocuments({
                status: 'approved',
                dueDate: { $lt: new Date() },
                ...dateFilter
            }),
            Fine.aggregate([
                { $match: fineDateFilter },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Fine.aggregate([
                { $match: { status: 'paid', ...fineDateFilter } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Fine.aggregate([
                { $match: { status: 'pending', ...fineDateFilter } },
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

module.exports = { getSettings, upsertSetting, getAdminStats, getPublicSettings };
