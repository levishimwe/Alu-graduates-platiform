const express = require('express');
const { User, Project } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

const graduateAuth = (req, res, next) => {
  if (req.user.userType !== 'graduate') {
    return res.status(403).json({ message: 'Graduate access required' });
  }
  next();
};

router.get('/all', async (_req, res) => {
  try {
    const graduates = await User.find({ userType: 'graduate' })
      .select('firstName lastName email bio university graduationYear city country profileImage createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json(graduates.map((graduate) => ({ ...graduate, id: graduate._id.toString() })));
  } catch (error) {
    console.error('Error fetching all graduates:', error);
    res.status(500).json({ message: 'Error fetching graduates' });
  }
});

router.get('/dashboard', auth, graduateAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const projects = await Project.find({ graduateId: userId }).sort({ createdAt: -1 }).lean();

    const totalProjects = projects.length;
    const approvedProjects = projects.filter((project) => project.status === 'approved' || project.status === 'active').length;
    const pendingProjects = projects.filter((project) => project.status === 'pending').length;
    const totalViews = projects.reduce((sum, project) => sum + (project.views || 0), 0);
    const totalLikes = projects.reduce((sum, project) => sum + (project.likes || 0), 0);

    res.json({
      stats: { totalProjects, approvedProjects, pendingProjects, totalViews, totalLikes },
      recentProjects: projects.slice(0, 5)
    });
  } catch (error) {
    console.error('Graduate dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/projects', auth, graduateAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const projects = await Project.find({ graduateId: userId }).sort({ createdAt: -1 }).lean();
    res.json({ projects });
  } catch (error) {
    console.error('Get graduate projects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/analytics/:projectId', auth, graduateAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userId = req.user.userId || req.user.id;
    if (String(project.graduateId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      views: project.views || 0,
      likes: project.likes || 0,
      status: project.status,
      createdAt: project.createdAt
    });
  } catch (error) {
    console.error('Get project analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/messages', auth, graduateAuth, async (_req, res) => {
  try {
    res.json({ messages: [] });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
