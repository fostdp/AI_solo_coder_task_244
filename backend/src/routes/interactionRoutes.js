const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');

router.get('/search', interactionController.searchInteractions);
router.get('/quick', interactionController.getQuickCheck);
router.post('/check', interactionController.checkTwoDrugs);
router.post('/batch', interactionController.batchCheck);
router.get('/', interactionController.getAllInteractions);

module.exports = router;
