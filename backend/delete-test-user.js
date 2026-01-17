require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const emailToDelete = 'krishnaspattel@gmail.com';

const deleteUser = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const result = await User.deleteOne({ email: emailToDelete });
        if (result.deletedCount > 0) {
            console.log(`✅ User ${emailToDelete} successfully deleted.`);
        } else {
            console.log(`⚠️ User ${emailToDelete} not found.`);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

deleteUser();
