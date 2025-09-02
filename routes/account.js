const express = require('express');
const router = express.Router();

const { isLoggedIn, isAdmin, isUser } = require('../middlewares/auth');

const account = require("../controllers/account");



router.get('/doctor/:id', isLoggedIn, isUser, account.doctor);

// router.get('/userDashboard/:id', isLoggedIn, isUser, account.user);
//
// router.get('/organiserDashboard/:id', isLoggedIn, isUser, account.organizer);
//
// router.get('/promoterDashboard/:id', isLoggedIn, isUser, account.promoter);
//
// router.get('/vendorDashboard/:id', isLoggedIn, isUser, account.vendor);
//
// router.post('/subscribe/', account.subscribe);
//
// router.get("/editUserInfo/:id", isLoggedIn, account.edit );
//
// router.post('/updateInfo/:id', upload.single('profile_image'), isLoggedIn, account.update);


module.exports = router;
