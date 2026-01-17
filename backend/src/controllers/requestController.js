const HelpRequest = require('../models/HelpRequest');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Simple API Features class
class SimpleAPIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'latitude', 'longitude', 'radius'];
        excludedFields.forEach(el => delete queryObj[el]);

        if (this.queryString.search) {
            queryObj.$or = [
                { title: { $regex: this.queryString.search, $options: 'i' } },
                { description: { $regex: this.queryString.search, $options: 'i' } }
            ];
        }

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }
}

exports.createRequest = catchAsync(async (req, res, next) => {
    if (!req.body.civilian) req.body.civilian = req.user.id;

    const newRequest = await HelpRequest.create(req.body);
    await newRequest.populate('civilian', 'name email phone');

    const io = req.app.get('io');
    if (io) io.emit('new-request', newRequest);

    res.status(201).json(newRequest);
});

exports.getAllRequests = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.user.role === 'civilian') filter = { civilian: req.user.id };

    const features = new SimpleAPIFeatures(HelpRequest.find(filter), req.query)
        .filter()
        .sort();

    const requests = await features.query
        .populate('civilian', 'name email phone')
        .populate('claimedBy', 'name email phone');

    res.status(200).json(requests);
});

exports.getRequest = catchAsync(async (req, res, next) => {
    const request = await HelpRequest.findById(req.params.id)
        .populate('civilian', 'name email phone')
        .populate('claimedBy', 'name email phone');

    if (!request) {
        return next(new AppError('No request found with that ID', 404));
    }

    res.status(200).json(request);
});

exports.updateRequest = catchAsync(async (req, res, next) => {
    const request = await HelpRequest.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
        .populate('civilian', 'name email phone')
        .populate('claimedBy', 'name email phone');

    if (!request) {
        return next(new AppError('No request found with that ID', 404));
    }

    const io = req.app.get('io');
    if (io) io.emit('request-updated', request);

    res.status(200).json(request);
});

exports.claimRequest = catchAsync(async (req, res, next) => {
    const request = await HelpRequest.findById(req.params.id);
    if (!request) return next(new AppError('No request found', 404));

    if (request.status !== 'pending') return next(new AppError('Request already claimed or resolved', 400));

    request.claimedBy = req.user.id;
    request.status = 'claimed';
    await request.save();

    await request.populate('civilian', 'name email phone');
    await request.populate('claimedBy', 'name email phone');

    const io = req.app.get('io');
    if (io) io.emit('request-claimed', request);

    res.status(200).json(request);
});

exports.getMapData = catchAsync(async (req, res, next) => {
    // Return minimalistic data for map
    const requests = await HelpRequest.find({}).select('title category priority status location');
    res.status(200).json(requests);
});

exports.deleteRequest = catchAsync(async (req, res, next) => {
    const request = await HelpRequest.findByIdAndDelete(req.params.id);
    if (!request) return next(new AppError('No request found', 404));

    const io = req.app.get('io');
    if (io) io.emit('request-deleted', { id: req.params.id });

    res.status(200).json({ message: 'Request deleted' });
});

exports.getPending = catchAsync(async (req, res, next) => {
    const requests = await HelpRequest.find({ status: 'pending' })
        .populate('civilian', 'name email phone')
        .populate('claimedBy', 'name email phone')
        .sort('-createdAt');
    res.status(200).json(requests);
});

exports.getAvailable = catchAsync(async (req, res, next) => {
    const requests = await HelpRequest.find({ status: 'pending', claimedBy: null })
        .populate('civilian', 'name email phone')
        .sort('-createdAt');
    res.status(200).json(requests);
});

exports.getNearby = catchAsync(async (req, res, next) => {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) return next(new AppError('Please provide latitude and longitude', 400));

    const radiusInRadians = radius / 6371;

    const requests = await HelpRequest.find({
        status: 'pending',
        claimedBy: null,
        'location.coordinates': {
            $geoWithin: {
                $centerSphere: [[parseFloat(longitude), parseFloat(latitude)], radiusInRadians]
            }
        }
    }).populate('civilian', 'name email phone');

    res.status(200).json(requests);
});
