const jwt = require('jsonwebtoken');
const Invoice = require('../models/Invoice');
const User = require('../models/User');

// Create Invoice
exports.store = async (req, res) => {
  const token = req.session.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    const { patient, items, total_amount, status } = req.body;

    const invoice = new Invoice({
      patient,
      items,
      total_amount,
      status: status || 'unpaid',
      created_by: user._id
    });

    await invoice.save();
    req.flash('success', 'Invoice created successfully.');
    res.redirect('/invoices');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creating invoice.');
    res.redirect('/invoices');
  }
};

// Edit Invoice
exports.edit = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('patient');
    if (!invoice) {
      req.flash('error', 'Invoice not found.');
      return res.redirect('/invoices');
    }
    res.render('./invoices/edit', { invoice });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading invoice.');
    res.redirect('/invoices');
  }
};

// Update Invoice
exports.update = async (req, res) => {
  try {
    const { items, total_amount, status } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      req.flash('error', 'Invoice not found.');
      return res.redirect('/invoices');
    }

    invoice.items = items;
    invoice.total_amount = total_amount;
    invoice.status = status;

    await invoice.save();
    req.flash('success', 'Invoice updated successfully.');
    res.redirect('/invoices');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating invoice.');
    res.redirect('/invoices');
  }
};

// Delete Invoice
exports.destroy = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    req.flash('success', 'Invoice deleted successfully.');
    res.redirect('/invoices');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting invoice.');
    res.redirect('/invoices');
  }
};
