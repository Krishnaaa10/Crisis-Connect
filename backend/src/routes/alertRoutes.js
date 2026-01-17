const express = require('express');
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes - require authentication
router.use(authMiddleware.protect);

// Get all active alerts (all authenticated users)
router.get('/', alertController.getAlerts);

// Get single alert
router.get('/:id', alertController.getAlert);

// Admin-only routes
router.post('/', authMiddleware.restrictTo('admin'), alertController.createAlert);
router.put('/:id', authMiddleware.restrictTo('admin'), alertController.updateAlert);
router.put('/:id/deactivate', authMiddleware.restrictTo('admin'), alertController.deactivateAlert);
router.delete('/:id', authMiddleware.restrictTo('admin'), alertController.deleteAlert);

module.exports = router;
