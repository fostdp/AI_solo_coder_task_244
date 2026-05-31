const express = require('express');
const router = express.Router();
const multer = require('multer');
const medicineController = require('../controllers/medicineController');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', medicineController.getAllMedicines);
router.get('/expiring', medicineController.getExpiringMedicines);
router.get('/expired', medicineController.getExpiredMedicines);
router.get('/:id', medicineController.getMedicineById);
router.post('/', medicineController.addMedicine);
router.put('/:id', medicineController.updateMedicine);
router.delete('/:id', medicineController.deleteMedicine);
router.post('/scan', upload.single('image'), medicineController.scanMedicine);

module.exports = router;
