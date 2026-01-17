const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    skills: [{
        type: String,
        trim: true
    }],
    idProof: String,
    experienceCertificate: String,
    applicationStatus: {
        type: Number,
        default: 0,
        enum: [0, 1, 2] // 0: Pending, 1: Accepted, 2: Rejected
    },
    taskStatus: {
        type: Number,
        default: 0,
        enum: [0, 1, 2, 3, 4] // 0: Available, 1: Assigned, 2: Accepted, 3: Rejected, 4: Completed
    },
    bio: String,
    availability: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

volunteerProfileSchema.index({ skills: 1 });
volunteerProfileSchema.index({ applicationStatus: 1, taskStatus: 1 });

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
