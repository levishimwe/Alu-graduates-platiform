const express = require("express");
const { auth } = require("../middleware/auth");
const User = require("../models/User");
const GraduateProfile = require("../models/GraduateProfile");
const InvestorProfile = require("../models/InvestorProfile");

const router = express.Router();


const formatUser = (user) => ({
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  userType: user.userType,
  profileImage: user.profileImage,
  bio: user.bio,
  university: user.university,
  graduationYear: user.graduationYear,
  companyName: user.companyName,
  country: user.country,
  city: user.city,
  createdAt: user.createdAt,
});

const mergeProfileData = async (user) => {
  const base = formatUser(user);

  if (user.userType === "graduate") {
    const profile = await GraduateProfile.findOne({ userId: user._id }).lean();
    return {
      ...base,
      major: profile?.major || "",
      skills: profile?.skills || [],
      achievements: profile?.achievements || [],
      linkedinUrl: profile?.linkedinUrl || "",
      githubUrl: profile?.githubUrl || "",
      portfolioUrl: profile?.portfolioUrl || "",
    };
  }

  if (user.userType === "investor") {
    const profile = await InvestorProfile.findOne({ userId: user._id }).lean();
    return {
      ...base,
      company: profile?.company || user.companyName || "",
      position: profile?.position || "",
      investmentFocus: profile?.investmentFocus || [],
      investmentRange: profile?.investmentRange || "",
      linkedinUrl: profile?.linkedinUrl || "",
      companyWebsite: user.companyWebsite || "",
    };
  }

  return base;
};

// Get all users except current user
router.get("/", auth, async (req, res) => {
  try {
    
    const users = await User.find({
      _id: { $ne: req.user.id },
      isActive: true,
    })
      .sort({ firstName: 1, lastName: 1 })
      .limit(100)
      .lean();

    const usersWithProfiles = await Promise.all(users.map(mergeProfileData));
    res.json({ users: usersWithProfiles, total: usersWithProfiles.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users", message: error.message });
  }
});

// Search users
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json({ users: [] });

    const users = await User.find({
      _id: { $ne: req.user.id },
      isActive: true,
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .sort({ firstName: 1, lastName: 1 })
      .limit(10)
      .lean();

    const usersWithProfiles = await Promise.all(users.map(mergeProfileData));
    res.json({ users: usersWithProfiles, total: usersWithProfiles.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to search users", message: error.message });
  }
});

// Get user profile by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isActive: true }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const profileData = await mergeProfileData(user);
    res.json(profileData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile", message: error.message });
  }
});

module.exports = router;