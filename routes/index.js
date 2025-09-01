const express = require("express");
const path = require("path");
const moment = require('moment');
const router = require("express").Router();
// const Blog  = require('../models/Blog');
// const Booking  = require('../models/Booking');
// const Event = require('../models/Event');
// const Service = require('../models/Service');
// const Promotion = require('../models/Promotion');
// const Review = require('../models/Review');
// const Share = require('../models/Share');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');



router.get('/', async (req, res) => {
  res.render("./home/index");
});


router.get('/dashboard', async (req, res) => {
  res.render("./home/dashboard");
});




module.exports = router;
