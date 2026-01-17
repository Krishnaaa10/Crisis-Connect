
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Incident = require('./src/models/Incident');
const HelpRequest = require('./src/models/HelpRequest');
const Alert = require('./src/models/Alert');
const VolunteerProfile = require('./src/models/VolunteerProfile');

// Load env vars
dotenv.config();

const resetDB = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        console.log('Clearing Incidents...');
        const { deletedCount: incidents } = await Incident.deleteMany({});
        console.log(`Deleted ${incidents} incidents.`);

        console.log('Clearing Help Requests...');
        const { deletedCount: requests } = await HelpRequest.deleteMany({});
        console.log(`Deleted ${requests} help requests.`);

        console.log('Clearing Alerts...');
        const { deletedCount: alerts } = await Alert.deleteMany({});
        console.log(`Deleted ${alerts} alerts.`);

        console.log('Clearing Volunteer Profiles...');
        const { deletedCount: profiles } = await VolunteerProfile.deleteMany({});
        console.log(`Deleted ${profiles} volunteer profiles.`);

        console.log('Clearing Users...');
        const { deletedCount: users } = await User.deleteMany({});
        console.log(`Deleted ${users} users.`);

        console.log('✅ Database successfully reset!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error resetting DB:', err);
        process.exit(1);
    }
};

resetDB();
