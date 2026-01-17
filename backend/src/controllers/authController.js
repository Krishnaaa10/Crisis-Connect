const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-should-be-in-env', {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
        }
    });
};

exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password, role, phone } = req.body;

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'civilian',
        phone
    });

    if (user.role === 'volunteer') {
        await VolunteerProfile.create({
            userId: user._id,
            applicationStatus: 0,
            taskStatus: 0,
            skills: [],
            availability: true
        });
    }

    createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
});

exports.googleLogin = catchAsync(async (req, res, next) => {
    const { credential, role } = req.body;

    // 1. Verify Google Token
    // We use the REST API to avoid adding a new dependency for now
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);

    if (!response.ok) {
        return next(new AppError('Invalid Google Token', 400));
    }

    const payload = await response.json();
    const { email, name, sub: googleId, picture } = payload;

    // 2. Check if user exists
    let user = await User.findOne({ email });

    if (user) {
        // 3. User exists - Link Google ID if not present
        if (!user.googleId) {
            user.googleId = googleId;
            user.avatar = picture;
            await user.save({ validateBeforeSave: false }); // Skip password validation
        }
    } else {
        // 4. User does not exist - Register new user
        // Generate a random password since they logged in with Google
        const randomPassword = Math.random().toString(36).slice(-8) + Date.now();

        if (!role) {
            // If no role provided for new user, ask frontend to prompt for it
            return res.status(200).json({
                status: 'pending_role',
                message: 'Please select a role',
                googleData: { credential }
            });
        }

        // Validate role if provided, else default to civilian
        const userRole = (role === 'volunteer' || role === 'admin') ? role : 'civilian';

        user = await User.create({
            name,
            email,
            password: randomPassword, // You might want to flag this user as google-auth only
            role: userRole,
            googleId,
            avatar: picture,
            isVerified: true // Google emails are verified
        });

        if (user.role === 'volunteer') {
            await VolunteerProfile.create({
                userId: user._id,
                applicationStatus: 0,
                taskStatus: 0,
                skills: [],
                availability: true
            });
        }
    }

    // 5. Generate token and send response
    createSendToken(user, 200, res);
});

exports.getMe = catchAsync(async (req, res, next) => {
    // req.user is set by protect middleware
    res.status(200).json({
        status: 'success',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            phone: req.user.phone
        }
    });
});
