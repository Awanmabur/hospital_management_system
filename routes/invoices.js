const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// List invoices
router.get('/', isAuthenticated, async (req, res) => {
  const Invoice = require('../models/Invoice');
  const invoices = await Invoice.find().populate('patient').sort({ createdAt: -1 });
  res.render('./invoices/index', { invoices });
});

// Create Invoice
router.post('/store', isAuthenticated, invoiceController.store);

// Edit Invoice Form
router.get('/:id/edit', isAuthenticated, invoiceController.edit);

// Update Invoice
router.post('/:id/update', isAuthenticated, invoiceController.update);

// Delete Invoice
router.post('/:id/delete', isAuthenticated, invoiceController.destroy);

module.exports = router;
