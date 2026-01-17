
const User = require('../models/User');
const Incident = require('../models/Incident');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Simple in-memory store for system status (for now, could be DB)
// Default: ONLINE
let systemStatus = 'ONLINE';

exports.getSystemStatus = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: { status: systemStatus }
    });
});

exports.updateSystemStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    if (!['ONLINE', 'DEGRADED', 'OFFLINE'].includes(status)) {
        return next(new AppError('Invalid status', 400));
    }
    systemStatus = status;
    res.status(200).json({
        status: 'success',
        data: { status: systemStatus }
    });
});

exports.getVolunteers = catchAsync(async (req, res, next) => {
    const volunteers = await User.find({ role: 'volunteer' }).select('-password');

    // Aggregation to get stats per volunteer
    const volunteerStats = await Promise.all(volunteers.map(async (vol) => {
        const tasksAccepted = await Incident.countDocuments({ acceptedBy: vol._id });
        const tasksCompleted = await Incident.countDocuments({ acceptedBy: vol._id, status: 3 });

        return {
            ...vol.toObject(),
            tasksAccepted,
            tasksCompleted
        };
    }));

    res.status(200).json({
        status: 'success',
        results: volunteers.length,
        data: volunteerStats
    });
});

exports.verifyVolunteer = catchAsync(async (req, res, next) => {
    const { isVerified } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, { isVerified }, {
        new: true,
        runValidators: true
    }).select('-password');

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: user
    });
});
