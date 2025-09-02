const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const moment = require('moment');

const Blog = require('../models/Blog');
const User = require('../models/User');
const {user} = require("../middlewares/auth");

// ***index route***


// ***create report route***
exports.create = async (req, res, next) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);
    res.render('./Blogs/create', {user});
  } catch (error) {
    req.flash('error', 'There is problem getting your blogs, please try again.');
    return res.redirect('/');
  }
};


// ***store report route***
exports.store = async (req, res, next) => {

 try {
   const token = req.session.token;

   if (!token) {
     req.flash('error', 'Your token has expired please login again.');
     return res.redirect('/signup&login');
   }

    const { title, content } = req.body;

    let image = null;

    // Image upload to Cloudinary
    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'Blog_Images' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      image = result.secure_url;
    }

    // Verify JWT token
    const decodedToken = jwt.verify(token, 'jwtSecret');
    const userId = decodedToken.userId;
    // Get user and account details
    const user = await User.findById(userId);

     const blog = new Blog({ user:userId, publisher:userId, image, title, content });

     await blog.save();
 
     req.flash('success', 'You have successfully created your blog post.');
     res.redirect('/amokprofile');

  } catch (error) {
    console.log(error);
    req.flash('error', 'There is problem posting blog, please try again later.');
    res.redirect('/demnprofile');
  }
};


// ***edit report route***
exports.edit = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user;
  const isUserLogin = await User.findById(userId);
  const user = await User.findById(userId);
  const blog = await Blog.findOne({ _id: id });
  res.render("./Blogs/edit", { blog, user, isUserLogin });
};


// ***edit update route***
exports.update = async (req, res, next) => {
try {
  const blogId = req.params.id;
  const { title, content } = req.body;

  const existingBlog = await Blog.findById(blogId);

  if (!existingBlog ) {
    req.flash('error', 'Unauthorized or blog not found.');
    return res.redirect('/amok');
  }

  let newImage = existingBlog.image;

  // If a new file is uploaded
  if (req.file) {
    // Delete old image from Cloudinary
    if (existingBlog.image) {
      const publicId = existingBlog.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`Blog_Images/${publicId}`);
    }

    const buffer = await sharp(req.file.buffer)
      .resize(800)
      .jpeg({ quality: 80 })
      .toBuffer();

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'Blog_Images' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    newImage = result.secure_url;
  }

  // Update the blog post with the new data
  existingBlog.title = title;
  existingBlog.content = content;
  existingBlog.image = newImage || existingBlog.image; // Use the new image URL or keep the existing one

  // Save the updated blog post
  await existingBlog.save();
  req.flash('success', 'You have successfully updated one blog post.');
  res.redirect('/profile');

} catch (error) {
  console.log(error);
  req.flash('error', 'there is problem updating your post');
  return res.redirect('/Blog');
}
};


// ***route to show more ***
exports.show = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const isUserLogin = await User.findById(userId);
    const user = await User.findById(userId);

    const blog = await Blog.findOne({ _id: id }).populate("publisher");

    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    const events = await Event.find({});

    res.render("./Blogs/show", { blog, events, userId, user, isUserLogin });

  } catch (err) {
    console.error("Error fetching blog:", err);
    next(err); // Pass to error handler middleware
  }
};



exports.BlogAdmin = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user;
  const user = await User.findById(userId);
  const blog = await Blog.findOne({ _id: id });
  res.render("./admin/moreabout", { blog, userId, user });
};

// ***route for deleting image and associated text ***
exports.destroy = async (req, res) => {
  const token = req.session.token;
  if (!token) {
    req.flash('error', 'Session expired. Please log in again.');
    return res.redirect('/login');
  }

  try {
    const decodedToken = jwt.verify(token, 'jwtSecret');
    const userId = decodedToken.userId;
    const blogId = req.params.blogId;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      req.flash('error', 'blog not found.');
      return res.redirect('/profile');
    }

    if (blog.image) {
      const publicId = blog.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`Blogs_Images/${publicId}`);
    }

    await blog.deleteOne({ _id: blogId });
    req.flash('success', 'Blog deleted successfully.');
    res.redirect('/profile');
  } catch (err) {
    console.error('Error deleting blog:', err);
    req.flash('error', 'Error deleting blog.');
    res.redirect('/');
  }
};
