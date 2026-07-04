const User = require("../models/User");
const GraduateProfile = require("../models/GraduateProfile");
const cloudinary = require("../config/cloudinary");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile = null;
    if (user.userType === "graduate") {
      profile = await GraduateProfile.findOne({ userId: req.user.id });
    }

    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ["firstName", "lastName", "bio", "country", "city", "companyName", "companyWebsite"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// Upload degree certificate (PDF) to Cloudinary
exports.uploadDegree = async (req, res) => {
  if (!req.file || req.file.mimetype !== "application/pdf") {
    return res.status(400).json({ message: "Invalid file. PDF only." });
  }
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "alu-platform/degrees",
      resource_type: "raw",
    });

    await GraduateProfile.findOneAndUpdate(
      { userId: req.user.id },
      { degreeCertificate: result.secure_url },
      { upsert: true, new: true }
    );

    res.json({ message: "Degree uploaded successfully", url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: "Degree upload failed", error: error.message });
  }
};

// Upload profile avatar to Cloudinary
exports.uploadAvatar = async (req, res) => {
  
  if (!req.file || !req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({ message: "Invalid file. Image only." });
  }
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "alu-platform/avatars",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: result.secure_url },
      { new: true }
    ).select("-password");

    res.json({ message: "Avatar uploaded successfully", profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ message: "Avatar upload failed", error: error.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    await GraduateProfile.findOneAndDelete({ userId: req.user.id });
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};
