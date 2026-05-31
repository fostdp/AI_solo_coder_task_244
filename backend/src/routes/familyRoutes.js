const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');

router.get('/', familyController.getMyFamilies);
router.post('/', familyController.createFamily);
router.get('/users/search', familyController.searchUsers);
router.get('/:id', familyController.getFamilyById);
router.put('/:id', familyController.updateFamily);
router.delete('/:id', familyController.deleteFamily);
router.get('/:id/members', familyController.getFamilyMembers);
router.post('/:id/members', familyController.addFamilyMember);
router.delete('/:id/members', familyController.removeFamilyMember);
router.get('/:id/medicines', familyController.getFamilyMedicines);
router.post('/:id/medicines', familyController.addMedicineToFamily);
router.delete('/:id/medicines', familyController.removeMedicineFromFamily);

module.exports = router;
