const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

// Create Medicine
exports.store = async (req, res) => {
  const token = req.session.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    const { name, description, price, stock, expiry_date } = req.body;
    let imageUrl = null;

    if (req.file) {
      const buffer = await sharp(req.file.buffer).resize(800).jpeg({ quality: 80 }).toBuffer();
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'Medicine_Images' }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }).end(buffer);
      });
      imageUrl = result.secure_url;
    }

    const medicine = new Medicine({
      name,
      description,
      price,
      stock,
      expiry_date,
      image: imageUrl,
      created_by: user._id
    });

    await medicine.save();
    req.flash('success', 'Medicine created successfully.');
    res.redirect('/medicines');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creating medicine.');
    res.redirect('/medicines');
  }
};

// Edit Medicine
exports.edit = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      req.flash('error', 'Medicine not found.');
      return res.redirect('/medicines');
    }
    res.render('./medicines/edit', { medicine });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading medicine.');
    res.redirect('/medicines');
  }
};

// Update Medicine
exports.update = async (req, res) => {
  try {
    const { name, description, price, stock, expiry_date } = req.body;
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      req.flash('error', 'Medicine not found.');
      return res.redirect('/medicines');
    }

    let imageUrl = medicine.image;
    if (req.file) {
      if (medicine.image) {
        const publicId = medicine.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`Medicine_Images/${publicId}`);
      }
      const buffer = await sharp(req.file.buffer).resize(800).jpeg({ quality: 80 }).toBuffer();
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'Medicine_Images' }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }).end(buffer);
      });
      imageUrl = result.secure_url;
    }

    medicine.name = name;
    medicine.description = description;
    medicine.price = price;
    medicine.stock = stock;
    medicine.expiry_date = expiry_date;
    medicine.image = imageUrl;

    await medicine.save();
    req.flash('success', 'Medicine updated successfully.');
    res.redirect('/medicines');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating medicine.');
    res.redirect('/medicines');
  }
};

// Delete Medicine
exports.destroy = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      req.flash('error', 'Medicine not found.');
      return res.redirect('/medicines');
    }

    if (medicine.image) {
      const publicId = medicine.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`Medicine_Images/${publicId}`);
    }

    await medicine.deleteOne();
    req.flash('success', 'Medicine deleted successfully.');
    res.redirect('/medicines');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting medicine.');
    res.redirect('/medicines');
  }
};
