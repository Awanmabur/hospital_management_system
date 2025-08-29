const LiveStream = require('../models/LiveStream');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// CREATE livestream
exports.create = async (req, res) => {
  try {
    let thumbnailUrl = '';
    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'Livestream_Thumbnails' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(buffer);
      });

      thumbnailUrl = result.secure_url;
    }

    const newStream = new LiveStream({
      title: req.body.title,
      description: req.body.description,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      event: req.body.event,
      stream_url: req.body.stream_url,
      thumbnail: thumbnailUrl
    });

    await newStream.save();
    res.redirect('/admin/livestreams'); // Or return JSON for API
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating livestream');
  }
};

// GET all livestreams
exports.index = async (req, res) => {
  const streams = await LiveStream.find().populate('event');
  res.render('livestreams/index', { streams });
};

// GET single livestream
exports.show = async (req, res) => {
  const stream = await LiveStream.findById(req.params.id).populate('event');
  if (!stream) return res.status(404).send('Not found');
  res.render('livestreams/show', { stream });
};

// EDIT form
exports.edit = async (req, res) => {
  const stream = await LiveStream.findById(req.params.id);
  if (!stream) return res.status(404).send('Not found');
  res.render('livestreams/edit', { stream });
};

// UPDATE livestream
exports.update = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);
    if (!stream) return res.status(404).send('Not found');

    if (req.file) {
      if (stream.thumbnail) {
        const publicId = stream.thumbnail.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`Livestream_Thumbnails/${publicId}`);
      }

      const buffer = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'Livestream_Thumbnails' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(buffer);

        stream.thumbnail = result.secure_url;
      });
    }

    stream.title = req.body.title;
    stream.description = req.body.description;
    stream.start_time = req.body.start_time;
    stream.end_time = req.body.end_time;
    stream.stream_url = req.body.stream_url;
    stream.event = req.body.event;

    await stream.save();
    res.redirect(`/livestreams/${stream._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating livestream');
  }
};

// DELETE livestream
exports.destroy = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);
    if (!stream) return res.status(404).send('Not found');

    if (stream.thumbnail) {
      const publicId = stream.thumbnail.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`Livestream_Thumbnails/${publicId}`);
    }

    await LiveStream.findByIdAndDelete(req.params.id);
    res.redirect('/admin/livestreams');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting livestream');
  }
};
