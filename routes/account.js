const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require("fs");
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;


const { isLoggedIn, isAdmin, isUser } = require('../middlewares/auth');

const account = require("../controllers/account");


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



router.get('/adminDashboard/:id', isLoggedIn, isAdmin, account.admin);

router.get('/userDashboard/:id', isLoggedIn, isUser, account.user);

router.get('/organiserDashboard/:id', isLoggedIn, isUser, account.organizer);

router.get('/promoterDashboard/:id', isLoggedIn, isUser, account.promoter);

router.get('/vendorDashboard/:id', isLoggedIn, isUser, account.vendor);

router.post('/subscribe/', account.subscribe);

router.get("/editUserInfo/:id", isLoggedIn, account.edit );

router.post('/updateInfo/:id', upload.single('profile_image'), isLoggedIn, account.update);


module.exports = router;
