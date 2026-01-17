const express = require('express');
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/map-data', requestController.getMapData);
router.get('/pending', requestController.getPending);
router.get('/available', requestController.getAvailable);
router.get('/nearby', requestController.getNearby);
router.post('/:id/claim', requestController.claimRequest);

router
    .route('/')
    .get(requestController.getAllRequests)
    .post(requestController.createRequest);

router
    .route('/:id')
    .get(requestController.getRequest)
    .put(requestController.updateRequest)
    .delete(requestController.deleteRequest);

module.exports = router;
