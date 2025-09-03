const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require("fs")

const patient = require('../models/Patient');

const patients = require("../controllers/Patient");

const {checkLoginStatus} = require("../middlewares/loginStatus");
const cloudinary = require('cloudinary').v2;


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,       // Your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});

// Set up Cloudinary storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to check file size
const checkFileSize = (req, res, next) => {
  const file = req.file;

  // Check if an image was uploaded
  if (!file) {
    req.flash('error', 'No image uploaded.');
    return res.redirect('/profile');
  }

  // Check if it's a valid image type
  if (!file.mimetype.startsWith('image/')) {
    req.flash('error', 'Uploaded file is not a valid image.');
    return res.redirect('/profile');
  }

  // Check file size (limit: 2MB)
  if (file.size > 2 * 1024 * 1024) {
    req.flash('error', 'Image exceeds the 2MB size limit.');
    return res.redirect('/profile');
  }

  next();
};


// router.get('/add_patient', patients.index);
//
router.get('/patient/:id', checkLoginStatus, patients.show);

// router.get('/delete-review/:postId', reviews.destroy );
//
router.get('/create_patient', patients.create);

router.post('/add_patient', upload.single('imageUrl'), patients.store);

// router.get("/edit-review/:id", reviews.edit );
//
// router.post('/edit-review/:id', upload.single('imageUrl'), reviews.update);



module.exports = router;
