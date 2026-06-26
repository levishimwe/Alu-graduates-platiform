const express = require('express');
const router = express.Router();
const { User, GraduateProfile, InvestorProfile } = require('../models');
const auth = require('../middleware/auth');

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
  createdAt: user.createdAt
});

const mergeProfileData = async (user) => {
  const profileData = formatUser(user);

  if (user.userType === 'graduate') {
    const graduateProfile = await GraduateProfile.findOne({ userId: user._id }).lean();
    return {
      ...profileData,
      major: graduateProfile?.major || '',
      skills: graduateProfile?.skills || [],
      achievements: graduateProfile?.achievements || [],
      linkedinUrl: graduateProfile?.linkedinUrl || '',
      githubUrl: graduateProfile?.githubUrl || '',
      portfolioUrl: graduateProfile?.portfolio || ''
    };
  }

  if (user.userType === 'investor') {
    const investorProfile = await InvestorProfile.findOne({ userId: user._id }).lean();
    return {
      ...profileData,
      company: investorProfile?.company || user.companyName || '',
      position: investorProfile?.position || '',
      investment_focus: investorProfile?.investmentFocus || [],
      investment_range: investorProfile?.investmentRange || '',
      linkedinUrl: investorProfile?.linkedinProfile || '',
      companyWebsite: user.companyWebsite || ''
    };
  }

  return profileData;
};

// GET all users (for ContactModal)
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching all users for user:', req.user.userId);

    const users = await User.find({
      _id: { $ne: req.user.userId },
      isActive: true
    })
      .sort({ firstName: 1, lastName: 1 })
      .limit(100)
      .lean();

    const usersWithProfiles = await Promise.all(users.map(mergeProfileData));

    console.log(`Found ${usersWithProfiles.length} users`);
    res.json({ 
      users: usersWithProfiles,
      total: usersWithProfiles.length 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error.message 
    });
  }
});

// GET search users with autocomplete
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.userId;
    
    console.log(`Searching users with query: "${q}" for user:`, currentUserId);
    
    if (!q || q.length < 1) {
      return res.json({ users: [] });
    }
    
    const users = await User.find({
      _id: { $ne: currentUserId },
      isActive: true,
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .sort({ firstName: 1, lastName: 1 })
      .limit(10)
      .lean();

    const usersWithProfiles = await Promise.all(users.map(mergeProfileData));

    console.log(`Found ${usersWithProfiles.length} users matching "${q}"`);
    res.json({ 
      users: usersWithProfiles,
      total: usersWithProfiles.length 
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ 
      error: 'Failed to search users',
      message: error.message 
    });
  }
});

// GET user profile by ID (for viewing other users' profiles)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Fetching profile for user ID: ${id}`);
    
    const user = await User.findOne({ _id: id, isActive: true }).lean();
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'The requested user profile does not exist or is inactive' 
      });
    }
    
    let profileData = await mergeProfileData(user);
    
    console.log(`Successfully fetched profile for user: ${profileData.firstName} ${profileData.lastName}`);
    res.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user profile',
      message: error.message 
    });
  }
});

module.exports = router;