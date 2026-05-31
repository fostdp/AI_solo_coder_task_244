const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');

router.get('/', pharmacyController.getAllPharmacies);
router.get('/nearby', pharmacyController.getNearbyPharmacies);
router.get('/medicine/search', pharmacyController.searchMedicine);
router.get('/medicine/availability', pharmacyController.checkAvailability);
router.get('/alerts', pharmacyController.getMyInventoryAlerts);
router.post('/alerts', pharmacyController.createInventoryAlert);
router.delete('/alerts/:id', pharmacyController.deactivateAlert);
router.get('/:id', pharmacyController.getPharmacyById);
router.get('/:id/inventory', pharmacyController.getPharmacyInventory);

module.exports = router;
