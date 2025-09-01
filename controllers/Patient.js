// controllers/patientController.js
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
// const cloudinary = require("../config/cloudinary");
const Patient = require("../models/Patient");
const User = require("../models/User");


exports.create = async (req, res, next) => {
  try {
    // const userId = req.user;
    // const user = await User.findById(userId);
    res.render('./patients/add_patient');
  } catch (error) {
    req.flash('error', 'There is problem getting your blogs, please try again.');
    return res.redirect('/');
  }
};



exports.store = async (req, res) => {
  const token = req.session.token;

  if (!token) {
    req.flash("error", "Session expired. Please log in.");
    return res.redirect("/login");
  }

  try {
    // 🔑 Verify user
    const decoded = jwt.verify(token, "jwtSecret");
    const user = await User.findById(decoded.userId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/login");
    }

    const {
      date_of_birth,
      gender,
      address,
      emergency_contact,
      blood_group,
      allergies,
      medical_history
    } = req.body;

    let profileImageUrl = null;

    // 🖼 Profile image upload to Cloudinary
    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize(600)
        .jpeg({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "Patient_Profiles" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      profileImageUrl = result.secure_url;
    }

    // 🏥 Create patient record
    const patient = new Patient({
      user: user._id,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      blood_group,
      allergies: Array.isArray(allergies) ? allergies : [allergies],
      medical_history,
      profile_image: profileImageUrl
    });

    await patient.save();

    req.flash("success", "Patient registered successfully.");
    res.redirect(`/dashboard/${user._id}/patients`);
  } catch (error) {
    console.error("Error creating patient:", error);
    req.flash("error", "Error registering patient.");
    res.redirect("/patients/create");
  }
};
