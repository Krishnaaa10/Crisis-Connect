const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    taskType: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    incident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Incident',
        default: null
    },
    volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VolunteerProfile',
        required: true
    },
    status: {
        type: Number,
        default: 1,
        enum: [1, 2, 3, 4] // 1: Assigned, 2: Accepted, 3: Rejected, 4: Completed
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: Date,
    completedAt: Date,
    extraDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
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

taskSchema.index({ volunteer: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
