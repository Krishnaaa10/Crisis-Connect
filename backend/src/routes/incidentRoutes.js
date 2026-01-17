const express = require('express');
const incidentController = require('../controllers/incidentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes - require authentication
router.use(authMiddleware.protect);

// Get user's own incidents
router.get('/my-reports', incidentController.getMyIncidents);

// Get map data (all incidents for map display)
router.get('/map-data', incidentController.getMapData);

// Get incident stats
router.get('/stats', incidentController.getIncidentStats);

// Report incident (civilians)
router.post('/report', incidentController.createIncident);

// Get all incidents
router.get('/', incidentController.getIncidents);

// Get single incident
router.get('/:id', incidentController.getIncident);

// Volunteer routes
router.put('/:id/accept', authMiddleware.restrictTo('volunteer'), incidentController.acceptIncident);
router.put('/:id/resolve', authMiddleware.restrictTo('volunteer', 'admin'), incidentController.resolveIncident);

// Admin-only routes
router.put('/:id/verify', authMiddleware.restrictTo('admin'), incidentController.verifyIncident);
router.put('/:id/reject', authMiddleware.restrictTo('admin'), incidentController.rejectIncident);
router.put('/:id/status', authMiddleware.restrictTo('admin'), incidentController.updateIncidentStatus);
router.delete('/:id', authMiddleware.restrictTo('admin'), incidentController.deleteIncident);

module.exports = router;
