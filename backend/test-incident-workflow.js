
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Incident = require('./src/models/Incident');

// Load env vars
dotenv.config({ path: './.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

const verifyWorkflow = async () => {
    await connectDB();

    try {
        console.log('--- STARTING REFINED WORKFLOW VERIFICATION ---');

        // 1. Get Users
        const civilian = await User.findOne({ role: 'civilian' });
        const admin = await User.findOne({ role: 'admin' });
        const volunteer = await User.findOne({ role: 'volunteer' });

        if (!civilian || !admin || !volunteer) {
            console.error('Missing users!');
            process.exit(1);
        }

        // Ensure volunteer is verified
        volunteer.isVerified = true;
        await volunteer.save();
        console.log('Ensure volunteer is verified: OK');

        // 2. Incident Rejection Flow
        console.log('\nStep 1: Testing Incident Rejection Flow...');
        let badIncident = await Incident.create({
            location: 'Fake Location',
            type: 'Other',
            severity: 1,
            description: 'Spam Report',
            latitude: 12.0,
            longitude: 77.0,
            reportedBy: civilian._id,
            status: 0 // Pending
        });

        // Admin rejects
        badIncident.status = 4; // Rejected
        badIncident.rejectedReason = 'Spam content';
        await badIncident.save();
        console.log(`Incident Rejected. Status: ${badIncident.status} (Expected: 4)`);

        // 3. Main Happy Path
        console.log('\nStep 2: Testing Main Workflow (Report -> Verify -> Accept -> Resolve)...');
        let incident = await Incident.create({
            location: 'Refined Test Loc',
            type: 'Medical',
            severity: 5,
            description: 'Refined Workflow Test',
            latitude: 13.0,
            longitude: 78.0,
            reportedBy: civilian._id,
            status: 0 // Pending
        });
        console.log(`Incident Created. Status: ${incident.status}`);

        // Verify
        incident.status = 1;
        incident.verifiedBy = admin._id;
        await incident.save();
        console.log(`Incident Verified. Status: ${incident.status}`);

        // Accept (Volunteer)
        incident.status = 2;
        incident.acceptedBy = volunteer._id;
        await incident.save();
        console.log(`Incident Accepted. Status: ${incident.status}, By: ${incident.acceptedBy}`);

        // Resolve
        incident.status = 3;
        await incident.save();
        console.log(`Incident Resolved. Status: ${incident.status}`);

        console.log('\n--- REFINED WORKFLOW VERIFICATION SUCCESSFUL ---');
        process.exit(0);

    } catch (err) {
        console.error('Verification Failed:', err);
        process.exit(1);
    }
};

verifyWorkflow();
