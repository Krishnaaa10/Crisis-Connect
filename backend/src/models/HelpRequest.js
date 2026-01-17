const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    civilian: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Request must belong to a civilian']
    },
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description']
    },
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        },
        address: {
            type: String,
            trim: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    category: {
        type: String,
        enum: ['medical', 'shelter', 'food', 'rescue', 'other'],
        default: 'other'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'claimed', 'in-progress', 'resolved', 'cancelled'],
        default: 'pending'
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    notes: [{
        text: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Pre-save hook to set coordinates from lat/long if not set
requestSchema.pre('save', function (next) {
    if (this.location && this.location.latitude && this.location.longitude) {
        this.location.coordinates = [this.location.longitude, this.location.latitude];
    }
    next();
});

requestSchema.index({ 'location.coordinates': '2dsphere' });
requestSchema.index({ status: 1, claimedBy: 1 });

module.exports = mongoose.model('HelpRequest', requestSchema);
