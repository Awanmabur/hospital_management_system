const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require("fs");

const { isLoggedIn, isAdmin, isUser } = require('../middlewares/auth');

const account = require("../controllers/Attendee");


// Set storage engine for multer
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
});

// const upload = multer({ storage: storage });
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Check file format
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      req.fileValidationError = 'Only JPEG, PNG, and jpg images are allowed!';
      cb(null, false);
    }
  },
});

router.get('/userDashboard/:id', isLoggedIn, isUser, account.user);

// router.get('/organiserDashboard/:id', isLoggedIn, isUser, account.organizer);
//
// router.get('/promoterDashboard/:id', isLoggedIn, isUser, account.promoter);
//
// router.get('/vendorDashboard/:id', isLoggedIn, isUser, account.vendor);

// router.post('/subscribe/', account.subscribe);

router.get("/edit-userInfo/:id", isLoggedIn, account.edit );

router.post('/edit-user/:id', upload.single('imageUrl'), isLoggedIn, account.update);


module.exports = router;
