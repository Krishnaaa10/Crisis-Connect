const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['shelter', 'food', 'medical', 'water', 'other'],
        required: true
    },
    description: String,
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        },
        address: String
    },
    capacity: Number,
    currentOccupancy: {
        type: Number,
        default: 0
    },
    contact: {
        phone: String,
        email: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Resource', resourceSchema);
