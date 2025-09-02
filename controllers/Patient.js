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

 
// Get Patient for Edit
exports.edit = async (req, res) => {
  const token = req.session.token;
  if (!token) {
    req.flash("error", "Session expired. Please log in again.");
    return res.redirect("/login");
  }

  try {
    const decodedToken = jwt.verify(token, "jwtSecret");
    const userId = decodedToken.userId;
    const patientId = req.params.id;

    const isUserLogin = await User.findById(userId);

    const patient = await Patient.findById(patientId);
    if (!patient) {
      req.flash("error", "Patient not found.");
      return res.redirect("/patients");
    }

    res.render("./patients/edit", { patient, userId, isUserLogin });
  } catch (err) {
    console.error("Error retrieving patient:", err);
    req.flash("error", "Error retrieving patient.");
    res.redirect("/patients");
  }
};

// Update Patient
exports.update = async (req, res) => {
  const token = req.session.token;
  if (!token) {
    req.flash("error", "Session expired. Please log in.");
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, "jwtSecret");
    const user = await User.findById(decoded.userId);

    const patientId = req.params.id;
    const existingPatient = await Patient.findById(patientId);

    if (!existingPatient) {
      req.flash("error", "Patient not found.");
      return res.redirect("/patients");
    }

    const {
      firstName,
      lastName,
      dob,
      gender,
      phone,
      email,
      address,
      medicalHistory,
    } = req.body;

    let imageUrl = existingPatient.image;

    // If a new file is uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (existingPatient.image) {
        const publicId = existingPatient.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`Patient_Images/${publicId}`);
      }

      const buffer = await sharp(req.file.buffer)
        .resize(500)
        .jpeg({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "Patient_Images" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = result.secure_url;
    }

    existingPatient.firstName = firstName;
    existingPatient.lastName = lastName;
    existingPatient.dob = dob;
    existingPatient.gender = gender;
    existingPatient.phone = phone;
    existingPatient.email = email;
    existingPatient.address = address;
    existingPatient.medicalHistory = medicalHistory;
    existingPatient.image = imageUrl;

    await existingPatient.save();

    req.flash("success", "Patient updated successfully.");
    res.redirect(`/patients/${patientId}`);
  } catch (error) {
    console.error("Error updating patient:", error);
    req.flash("error", "Error updating patient.");
    res.redirect("/patients");
  }
};

// Delete Patient
exports.destroy = async (req, res) => {
  const token = req.session.token;
  if (!token) {
    req.flash("error", "Session expired. Please log in again.");
    return res.redirect("/login");
  }

  try {
    const decodedToken = jwt.verify(token, "jwtSecret");
    const patientId = req.params.id;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      req.flash("error", "Patient not found.");
      return res.redirect("/patients");
    }

    // Delete image from Cloudinary if exists
    if (patient.image) {
      const publicId = patient.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`Patient_Images/${publicId}`);
    }

    await patient.deleteOne({ _id: patientId });

    req.flash("success", "Patient deleted successfully.");
    res.redirect("/patients");
  } catch (err) {
    console.error("Error deleting patient:", err);
    req.flash("error", "Error deleting patient.");
    res.redirect("/patients");
  }
};
