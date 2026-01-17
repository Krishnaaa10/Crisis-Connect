// Shim to point to new src/server.js
// This allows the existing running process (nodemon server.js) to pick up the new code
require('./src/server');
