const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const counts = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        console.log('User Counts by Role:', counts);

        const volunteers = await User.find({ role: 'volunteer' }).select('name email isVerified');
        console.log('Volunteers:', volunteers);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkUsers();
