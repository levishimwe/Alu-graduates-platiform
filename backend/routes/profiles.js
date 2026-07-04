const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const User = require("../models/User");
const GraduateProfile = require("../models/GraduateProfile");
const InvestorProfile = require("../models/InvestorProfile");

const router = express.Router();

const ACCEPTED_MAJORS = [
  "BSE (Software Engineering)",
  "BEL (Entrepreneurial Leadership)",
  "IBT (International Business Trade)",
];

const formatGraduateProfile = async (user) => {
  const profile = await GraduateProfile.findOne({ userId: user._id }).lean();
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    profileImage: user.profileImage || "",
    university: user.university || "",
    graduationYear: profile?.graduationYear || user.graduationYear || "",
    major: profile?.major || "",
    skills: profile?.skills || [],
    achievements: profile?.achievements || [],
    portfolioUrl: profile?.portfolioUrl || "",
    linkedinUrl: profile?.linkedinUrl || "",
    githubUrl: profile?.githubUrl || "",
    availability: profile?.availability || "available",
  };
};

// Get all graduates (public)
router.get("/graduates", async (_req, res) => {
  try {
    const graduates = await User.find({ userType: "graduate", isActive: true })
      .select("firstName lastName email bio university graduationYear city country profileImage")
      .sort({ createdAt: -1 })
      .lean();
    res.json(graduates.map((g) => ({ ...g, id: g._id.toString() })));
  } catch (error) {
    res.status(500).json({ message: "Error fetching graduates", error: error.message });
  }
});

// Get a single graduate profile by ID (public)
router.get("/graduate/:id", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, userType: "graduate", isActive: true }).lean();
    if (!user) return res.status(404).json({ message: "Graduate not found" });
    res.json(await formatGraduateProfile(user));
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// Update graduate profile (authenticated graduates only)
router.put("/graduate", auth, requireRole("graduate"), async (req, res) => {
  try {
    const {
      firstName, lastName, bio, university, graduationYear,
      major, skills, achievements, portfolioUrl, linkedinUrl, githubUrl,
    } = req.body;

    // ALU-specific validations
    if (university && university.toLowerCase() !== "african leadership university") {
      return res.status(400).json({ message: "Only African Leadership University is accepted" });
    }
    if (major && !ACCEPTED_MAJORS.includes(major)) {
      return res.status(400).json({
        message: `Only these majors are accepted: ${ACCEPTED_MAJORS.join(", ")}`,
      });
    }

    const user = await User.findOne({ _id: req.user.id, userType: "graduate" });
    if (!user) return res.status(404).json({ message: "Graduate not found" });

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio) user.bio = bio;
    if (university) user.university = university;
    if (graduationYear) user.graduationYear = graduationYear;
    await user.save();

    // Update or create graduate profile
     await GraduateProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        ...(graduationYear && { graduationYear }),
        ...(major && { major }),
        ...(skills && { skills }),
        ...(achievements && { achievements }),
        ...(portfolioUrl && { portfolioUrl }),
        ...(linkedinUrl && { linkedinUrl }),
        ...(githubUrl && { githubUrl }),
        ...(bio && { experience: bio }),
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Profile updated successfully", profile: await formatGraduateProfile(user) });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// Get investor profile (authenticated investors only)
router.get("/investor", auth, requireRole("investor"), async (req, res) => {
  try {
    const profile = await InvestorProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile", message: error.message });
  }
});

// Update investor profile
router.put("/investor", auth, requireRole("investor"), async (req, res) => {
  try {
    const allowed = ["investmentFocus", "investmentRange", "portfolio", "linkedinUrl", "company", "position"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const profile = await InvestorProfile.findOneAndUpdate(
      { userId: req.user.id },
      { ...updates, userId: req.user.id },
      { upsert: true, new: true }
    );

    res.json({ message: "Investor profile updated successfully", profile });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile", message: error.message });
  }
});

module.exports = router;