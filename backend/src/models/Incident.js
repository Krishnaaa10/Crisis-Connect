const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    location: {
        type: String,
        required: [true, 'Please provide a location name'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Please provide incident type'],
        trim: true
    },
    severity: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    description: {
        type: String,
        required: [true, 'Please provide a description']
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
    },
    media: {
        type: [String],
        default: []
    },
    status: {
        type: Number,
        default: 0,
        enum: [0, 1, 2, 3, 4] // 0: Pending, 1: Verified, 2: Ongoing, 3: Completed, 4: Rejected
    },
    rejectedReason: String,
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    verifiedAt: Date,
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    acceptedAt: Date,
    resolvedAt: Date
}, {
    timestamps: true
});

incidentSchema.pre('save', function (next) {
    if (this.latitude && this.longitude) {
        this.coordinates = [this.longitude, this.latitude];
    }
    next();
});



module.exports = mongoose.model('Incident', incidentSchema);
