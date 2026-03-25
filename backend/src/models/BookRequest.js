const mongoose = require('mongoose');

const bookRequestSchema = new mongoose.Schema(
    {
        lecturer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        books: [
            {
                title: {
                    type: String,
                    required: true,
                    trim: true,
                },
                major: {
                    type: String,
                    required: true,
                    trim: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },
            },
        ],
        semester: {
            type: String,
            trim: true,
            default: 'Upcoming',
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        note: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('BookRequest', bookRequestSchema);
