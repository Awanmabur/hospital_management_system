const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require("fs")
const cloudinary = require('cloudinary').v2;

const {user} = require("../middlewares/auth");

const Blog  = require('../models/Blog');

const blogs = require("../controllers/Blog");

const {requireLogin} = require("../middlewares/loginrequest");

const {checkLoginStatus} = require("../middlewares/loginStatus");


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
  if (!req.files) {
    return res.status(400).send('No files uploaded.');
  }

  for (let key in req.files) {
    if (req.files[key][0].size > 2 * 1024 * 1024) {
      req.flash('error', `${key} exceeds the 2MB limit.`);
      return res.redirect('/profile');
    }
  }

  next();
};


router.get('/blogs', checkLoginStatus, blogs.index);

// router.get('/topnews', checkLoginStatus, blogs.indextopnews);
//
// router.get('/football', checkLoginStatus, blogs.football);
//
// router.get('/boxing', checkLoginStatus, blogs.boxing);
//
// router.get('/kick', checkLoginStatus, blogs.kick);
//
// router.get('/volleyball', checkLoginStatus, blogs.volleyball);
//
// router.get('/basketball', checkLoginStatus, blogs.basketball);
//
// router.get('/athletics', checkLoginStatus, blogs.athletic);
//
// router.get('/trendingnews', checkLoginStatus, blogs.trendingnews);
//
// router.get('/featuring', checkLoginStatus, blogs.featured);
//
// router.get('/latestnews', checkLoginStatus, blogs.latestnews);
//
router.get('/more/:id', checkLoginStatus, blogs.show);

router.get('/deleteBlog/:blogId', blogs.destroy );
 
router.post('/createBlog', upload.single('image'), requireLogin, blogs.store);

router.get("/editBlog/:id", requireLogin, blogs.edit );

router.post('/updateBlog/:id', upload.single('image'), requireLogin, blogs.update);

// router.get("/promote/:id", requireLogin, blogs.isPromoted );
//
// router.get("/remove-promotion/:id", requireLogin, blogs.removePromotion );
//
// router.get("/featured/:id", requireLogin, blogs.isFeatured );
//
// router.get("/remove-featured/:id", requireLogin, blogs.removeFeatured );



router.get('/like/:id', async (req, res) => {
  const postId = req.params.id;
  const post = await Blog .findById(postId);

  if (!post) {
      return res.status(404).send('Post not found');
  }

  if (post.likes === 0) {
      // If post has 0 likes, increment the count
      post.likes += 1;
  } else {
      // If post has more than 0 likes, decrement the count
      post.likes -= 1;
  }

  await post.save();
  res.redirect('/');
});


router.get('/love/:id', async (req, res) => {
const postId = req.params.id;
const post = await Blog .findById(postId);

if (!post) {
    return res.status(404).send('Post not found');
}

if (post.loves === 0) {
    // If post has 0 likes, increment the count
    post.loves += 1;
} else {
    // If post has more than 0 likes, decrement the count
    post.loves -= 1;
}

await post.save();
res.redirect('/');
});


// Comment on a post
router.post('/comment/:id', async (req, res) => {
    const post = await Blog .findById(req.params.id);
    post.comments.push({ text: req.body.comment, user: req.body.user });
    await post.save();
    res.redirect('/');
});

// Share a post
router.get('/share/:id', async (req, res) => {
    const post = await Blog .findById(req.params.id);
    post.shares += 1;
    await post.save();
    res.redirect('/');
});

module.exports = router;
