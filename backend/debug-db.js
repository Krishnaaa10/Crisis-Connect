require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('Attempting to connect to:', uri ? 'URI Found' : 'URI Missing');

if (!uri) {
    console.error('MONGODB_URI is undefined!');
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Connected successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection Error:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
        process.exit(1);
    });
