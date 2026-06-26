const express = require('express');
const { User, Project } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

const investorAuth = (req, res, next) => {
  if (req.user.userType !== 'investor') {
    return res.status(403).json({ message: 'Investor access required' });
  }
  next();
};

router.get('/dashboard', auth, investorAuth, async (_req, res) => {
  try {
    const featuredProjects = await Project.find({ featured: true, status: { $in: ['approved', 'active'] } })
      .sort({ views: -1 })
      .limit(6)
      .lean();

    const recentProjects = await Project.find({ status: { $in: ['approved', 'active'] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ featuredProjects, recentProjects });
  } catch (error) {
    console.error('Investor dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/bookmark/:projectId', auth, investorAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project bookmarked successfully' });
  } catch (error) {
    console.error('Bookmark project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/bookmarks', auth, investorAuth, async (_req, res) => {
  try {
    res.json({ bookmarks: [] });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/express-interest', auth, investorAuth, async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Interest expressed successfully' });
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/contact-graduate', auth, investorAuth, async (req, res) => {
  try {
    const { graduateId } = req.body;
    const graduate = await User.findOne({ _id: graduateId, userType: 'graduate' }).lean();
    if (!graduate) {
      return res.status(404).json({ message: 'Graduate not found' });
    }
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact graduate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/conversations', auth, investorAuth, async (_req, res) => {
  try {
    res.json({ conversations: [] });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
