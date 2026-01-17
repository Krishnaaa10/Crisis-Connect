const Alert = require('../models/Alert');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get all active alerts
exports.getAlerts = catchAsync(async (req, res, next) => {
    const { targetAudience } = req.query;

    let filter = { isActive: true };

    // Filter by target audience if provided
    if (targetAudience) {
        filter.$or = [
            { targetAudience: targetAudience },
            { targetAudience: 'all' }
        ];
    } else {
        // If no specific audience, show all active alerts
        filter.targetAudience = { $in: ['all', 'volunteers', 'civilians'] };
    }

    const alerts = await Alert.find(filter)
        .populate('createdBy', 'name email')
        .sort('-createdAt');

    res.status(200).json(alerts);
});

// Create a new alert (admin only)
exports.createAlert = catchAsync(async (req, res, next) => {
    const { title, message, type, targetAudience } = req.body;

    if (!title || !message) {
        return next(new AppError('Please provide title and message', 400));
    }

    const newAlert = await Alert.create({
        title,
        message,
        type: type || 'info',
        targetAudience: targetAudience || 'all',
        createdBy: req.user.id,
        isActive: true
    });

    await newAlert.populate('createdBy', 'name email');

    // Emit socket event for real-time alerts
    const io = req.app.get('io');
    if (io) {
        io.emit('new-alert', newAlert);
    }

    res.status(201).json({
        status: 'success',
        data: newAlert
    });
});

// Get a single alert by ID
exports.getAlert = catchAsync(async (req, res, next) => {
    const alert = await Alert.findById(req.params.id)
        .populate('createdBy', 'name email');

    if (!alert) {
        return next(new AppError('No alert found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: alert
    });
});

// Update an alert (admin only)
exports.updateAlert = catchAsync(async (req, res, next) => {
    const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!alert) {
        return next(new AppError('No alert found with that ID', 404));
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('alert-updated', alert);
    }

    res.status(200).json({
        status: 'success',
        data: alert
    });
});

// Deactivate an alert (admin only)
exports.deactivateAlert = catchAsync(async (req, res, next) => {
    const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    ).populate('createdBy', 'name email');

    if (!alert) {
        return next(new AppError('No alert found with that ID', 404));
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('alert-deleted', { id: req.params.id });
    }

    res.status(200).json({
        status: 'success',
        data: alert
    });
});

// Delete an alert permanently (admin only)
exports.deleteAlert = catchAsync(async (req, res, next) => {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
        return next(new AppError('No alert found with that ID', 404));
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('alert-deleted', { id: req.params.id });
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
