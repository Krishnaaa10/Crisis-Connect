require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const VolunteerProfile = require('./src/models/VolunteerProfile');

const deleteAllUsers = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to DB');

        // Delete all Volunteer Profiles first (to avoid orphans)
        const volunteerResult = await VolunteerProfile.deleteMany({});
        console.log(`✅ Deleted ${volunteerResult.deletedCount} volunteer profiles.`);

        // Delete all Users
        const userResult = await User.deleteMany({});
        console.log(`✅ Deleted ${userResult.deletedCount} users.`);

        console.log('🎉 Database cleared of all accounts.');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

deleteAllUsers();
