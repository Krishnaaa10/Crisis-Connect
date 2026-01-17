const Incident = require('../models/Incident');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get incidents reported by the current user
exports.getMyIncidents = catchAsync(async (req, res, next) => {
    const incidents = await Incident.find({ reportedBy: req.user.id })
        .populate('reportedBy', 'name email')
        .populate('verifiedBy', 'name email')
        .sort('-createdAt');

    res.status(200).json(incidents);
});

// Get map data (lightweight data for map markers)
exports.getMapData = catchAsync(async (req, res, next) => {
    const incidents = await Incident.find({})
        .select('type location latitude longitude severity status')
        .lean();

    res.status(200).json(incidents);
});

// Create a new incident report (for civilians)
exports.createIncident = catchAsync(async (req, res, next) => {
    const { location, type, severity, description, latitude, longitude } = req.body;

    // Validate required fields
    if (!location || !type || !description || !latitude || !longitude) {
        return next(new AppError('Please provide all required fields', 400));
    }

    // Validate severity
    if (severity < 1 || severity > 5) {
        return next(new AppError('Severity must be between 1 and 5', 400));
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return next(new AppError('Invalid coordinates', 400));
    }

    const newIncident = await Incident.create({
        location,
        type,
        severity,
        description,
        latitude,
        longitude,
        reportedBy: req.user.id,
        status: 0 // Pending
    });

    await newIncident.populate('reportedBy', 'name email');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
        io.emit('new-incident', newIncident);
    }

    res.status(201).json({
        status: 'success',
        message: 'Incident reported successfully. Admin will review and verify.',
        data: newIncident
    });
});

// Get all incidents (with filters)
exports.getIncidents = catchAsync(async (req, res, next) => {
    const { status, type, severity } = req.query;

    let filter = {};

    // Apply filters if provided
    if (status !== undefined) filter.status = parseInt(status);
    if (type) filter.type = type;
    if (severity) filter.severity = parseInt(severity);

    const incidents = await Incident.find(filter)
        .populate('reportedBy', 'name email')
        .populate('verifiedBy', 'name email')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: incidents.length,
        data: incidents
    });
});

// Get a single incident by ID
exports.getIncident = catchAsync(async (req, res, next) => {
    const incident = await Incident.findById(req.params.id)
        .populate('reportedBy', 'name email')
        .populate('verifiedBy', 'name email');

    if (!incident) {
        return next(new AppError('No incident found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: incident
    });
});

// Verify incident (admin only)
exports.verifyIncident = catchAsync(async (req, res, next) => {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
        return next(new AppError('No incident found with that ID', 404));
    }

    incident.status = 1; // Verified
    incident.verifiedBy = req.user.id;
    incident.verifiedAt = new Date();
    await incident.save();

    await incident.populate('reportedBy', 'name email');
    await incident.populate('verifiedBy', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('incident-verified', incident);
    }

    res.status(200).json({
        status: 'success',
        message: 'Incident verified successfully',
        data: incident
    });
});

// Reject incident (admin only)
exports.rejectIncident = catchAsync(async (req, res, next) => {
    const { reason } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
        return next(new AppError('No incident found with that ID', 404));
    }

    incident.status = 4; // Rejected
    incident.rejectedReason = reason || 'No reason provided';
    await incident.save();

    await incident.populate('reportedBy', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('incident-rejected', incident);
    }

    res.status(200).json({
        status: 'success',
        message: 'Incident rejected successfully',
        data: incident
    });
});

// Update incident status (admin only)
exports.updateIncidentStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;

    if (status === undefined || status < 0 || status > 4) {
        return next(new AppError('Invalid status. Must be 0-4', 400));
    }

    const incident = await Incident.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    )
        .populate('reportedBy', 'name email')
        .populate('verifiedBy', 'name email');

    if (!incident) {
        return next(new AppError('No incident found with that ID', 404));
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('incident-updated', incident);
    }

    res.status(200).json({
        status: 'success',
        data: incident
    });
});

// Accept incident (volunteer only)
exports.acceptIncident = catchAsync(async (req, res, next) => {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
        return next(new AppError('No incident found with that ID', 404));
    }

    if (!req.user.isVerified) {
        return next(new AppError('You must be verified by admin to accept incidents', 403));
    }

    if (incident.status !== 1) {
        return next(new AppError('Incident must be verified before it can be accepted', 400));
    }

    incident.status = 2; // Ongoing/Accepted
    incident.acceptedBy = req.user.id;
    incident.acceptedAt = new Date();
    await incident.save();

    await incident.populate('reportedBy', 'name email');
    await incident.populate('verifiedBy', 'name email');
    await incident.populate('acceptedBy', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('incident-accepted', incident);
    }

    res.status(200).json({
        status: 'success',
        message: 'Incident accepted successfully',
        data: incident
    });
});

// Resolve incident (volunteer or admin)
exports.resolveIncident = catchAsync(async (req, res, next) => {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
        return next(new AppError('No incident found with that ID', 404));
    }

    if (incident.status !== 2) {
        return next(new AppError('Incident must be ongoing/accepted before it can be resolved', 400));
    }

    incident.status = 3; // Resolved
    incident.resolvedAt = new Date();
    await incident.save();

    await incident.populate('reportedBy', 'name email');
    await incident.populate('verifiedBy', 'name email');
    await incident.populate('acceptedBy', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('incident-resolved', incident);
    }

    res.status(200).json({
        status: 'success',
        message: 'Incident resolved successfully',
        data: incident
    });
});

// Get incident stats
exports.getIncidentStats = catchAsync(async (req, res, next) => {
    // 0: Pending, 1: Verified, 2: Ongoing, 3: Completed, 4: Rejected

    // Global counts (for everyone/admin)
    const stats = await Incident.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const statsObj = {
        pending: 0,
        verified: 0,
        ongoing: 0,
        resolved: 0,
        rejected: 0,
        totalReported: 0,
        totalActive: 0,
        myAccepted: 0,
        myResolved: 0
    };

    stats.forEach(stat => {
        if (stat._id === 0) statsObj.pending = stat.count;
        if (stat._id === 1) statsObj.verified = stat.count;
        if (stat._id === 2) statsObj.ongoing = stat.count;
        if (stat._id === 3) statsObj.resolved = stat.count;
        if (stat._id === 4) statsObj.rejected = stat.count;
    });

    // "Incidents Reported" - All incidents submitted (global count)
    statsObj.totalReported = statsObj.pending + statsObj.verified + statsObj.ongoing + statsObj.resolved + statsObj.rejected;

    // "Active Incidents" logic
    // Default (Civilian/Admin) "Active" = Verified + Ongoing
    statsObj.totalActive = statsObj.verified + statsObj.ongoing;

    // For Civilian: "Active Incidents" = Status ACTIVE (1) or IN_PROGRESS (2) -- Matches Logic above

    // Volunteer specific Logic
    if (req.user && req.user.role === 'volunteer') {
        const myStats = await Incident.aggregate([
            {
                $match: { acceptedBy: req.user._id }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        myStats.forEach(stat => {
            if (stat._id === 2) statsObj.myAccepted = stat.count;
            if (stat._id === 3) statsObj.myResolved = stat.count;
        });

        // For Volunteer "Active Incidents" = Verified incidents available for acceptance
        // NOTE: User prompt said "Active Incidents - Verified incidents available for acceptance"
        statsObj.totalActive = statsObj.verified;
    }

    res.status(200).json({
        status: 'success',
        data: statsObj
    });
});

// Delete incident (admin only)
exports.deleteIncident = catchAsync(async (req, res, next) => {
    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
        return next(new AppError('No incident found with that ID', 404));
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('incident-deleted', { id: req.params.id });
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
