
const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes - require authentication and admin role
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.get('/system-status', adminController.getSystemStatus);
router.put('/system-status', adminController.updateSystemStatus);

router.get('/volunteers', adminController.getVolunteers);
router.put('/volunteers/:id/verify', adminController.verifyVolunteer);

module.exports = router;
