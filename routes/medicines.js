const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const multer = require('multer');

// Multer memory storage (for sharp & cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// List medicines
router.get('/', isAuthenticated, async (req, res) => {
  const Medicine = require('../models/Medicine');
  const medicines = await Medicine.find().sort({ createdAt: -1 });
  res.render('./medicines/index', { medicines });
});

// Create Medicine
router.post('/store', isAuthenticated, upload.single('image'), medicineController.store);

// Edit Medicine Form
router.get('/:id/edit', isAuthenticated, medicineController.edit);

// Update Medicine
router.post('/:id/update', isAuthenticated, upload.single('image'), medicineController.update);

// Delete Medicine
router.post('/:id/delete', isAuthenticated, medicineController.destroy);

module.exports = router;
