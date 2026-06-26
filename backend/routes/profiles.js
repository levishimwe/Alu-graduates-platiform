const express = require('express');
const router = express.Router();
const { User, GraduateProfile } = require('../models');
const auth = require('../middleware/auth');

const formatGraduateProfile = async (user) => {
  const profile = await GraduateProfile.findOne({ userId: user._id }).lean();
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    bio: user.bio || '',
    profileImage: user.profileImage || '',
    university: user.university || '',
    graduationYear: profile?.graduationYear || user.graduationYear || '',
    major: profile?.major || '',
    skills: profile?.skills || [],
    achievements: profile?.achievements || [],
    portfolio_url: profile?.portfolio || '',
    linkedin_url: profile?.linkedinUrl || '',
    github_url: profile?.githubUrl || ''
  };
};

router.get('/graduates', async (_req, res) => {
  try {
    const graduates = await User.find({ userType: 'graduate' })
      .select('firstName lastName email bio university graduationYear city country profileImage')
      .lean();

    return res.json(graduates.map((graduate) => ({ ...graduate, id: graduate._id.toString() })));
  } catch (error) {
    console.error('Error fetching graduates:', error);
    res.status(500).json({ message: 'Error fetching graduates' });
  }
});

router.get('/graduate/:id', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, userType: 'graduate' }).lean();
    if (!user) {
      return res.status(404).json({ message: 'Graduate not found' });
    }

    res.json(await formatGraduateProfile(user));
  } catch (error) {
    console.error('Error fetching graduate profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

router.put('/graduate', auth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { firstName, lastName, bio, university, graduationYear, major, skills, achievements, portfolio_url, linkedin_url, github_url } = req.body;

    if (university && university.toLowerCase() !== 'african leadership university') {
      return res.status(400).json({ message: 'Only African Leadership University is accepted' });
    }

    const acceptedMajors = [
      'BSE (Software Engineering)',
      'BEL (Entrepreneurial Leadership)',
      'IBT (International Business Trade)'
    ];

    if (major && !acceptedMajors.includes(major)) {
      return res.status(400).json({ message: 'Only BSE (Software Engineering), BEL (Entrepreneurial Leadership), and IBT (International Business Trade) majors are accepted' });
    }

    const user = await User.findOne({ _id: userId, userType: 'graduate' });
    if (!user) {
      return res.status(404).json({ message: 'Graduate not found' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.bio = bio || user.bio;
    user.university = university || user.university;
    user.graduationYear = graduationYear || user.graduationYear;
    await user.save();

    let profile = await GraduateProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new GraduateProfile({ userId: user._id });
    }

    profile.graduationYear = graduationYear || profile.graduationYear;
    profile.major = major || profile.major;
    profile.skills = skills || profile.skills;
    profile.achievements = achievements || profile.achievements;
    profile.portfolio = portfolio_url || profile.portfolio;
    profile.linkedinUrl = linkedin_url || profile.linkedinUrl;
    profile.githubUrl = github_url || profile.githubUrl;
    profile.experience = bio || profile.experience;
    await profile.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating graduate profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message, details: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
});

module.exports = router;