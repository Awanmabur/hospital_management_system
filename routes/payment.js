// routes/eventRoutes.js
const express = require('express');
const router = express.Router();

const {checkLoginStatus} = require("../middlewares/loginStatus");

const payment = require('../controllers/Payment');



// Routes
router.get('/payment', payment.index);

// router.get('/bookings/history', payment.history);
//
// // booking.js
// router.get('/book/:type/:id', payment.create);
//
//
// router.get('/show/:id', payment.show);
//
// router.post('/book/submit', payment.store);

// router.get('/edit/:id', booking.edit);
//
// router.post('/update/:id', booking.update);

// router.get('/delete/:eventId', booking.destroy);

module.exports = router;
