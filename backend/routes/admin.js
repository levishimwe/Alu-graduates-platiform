const express = require('express');
const auth = require('../middleware/auth');
const { User, Project } = require('../models');
const router = express.Router();

const adminAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.userType !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

const normalizeProject = (project) => ({
  ...project,
  id: project._id?.toString?.() || project.id,
  graduateId: project.graduateId?._id?.toString?.() || project.graduateId,
  technologies: Array.isArray(project.technologies) ? project.technologies : [],
  images: Array.isArray(project.images) ? project.images : [],
  videos: Array.isArray(project.videos) ? project.videos : [],
  documents: Array.isArray(project.documents) ? project.documents : []
});

router.get('/users', auth, adminAuth, async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

router.get('/projects', auth, adminAuth, async (_req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }).lean();
    const processedProjects = projects.map(normalizeProject);
    res.json({ projects: processedProjects, total: processedProjects.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects', message: error.message });
  }
});

router.put('/users/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !!req.body.isActive;
    await user.save();
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user status', message: error.message });
  }
});

router.put('/projects/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (req.body.status !== undefined) project.status = req.body.status;
    if (req.body.featured !== undefined) project.featured = req.body.featured;
    await project.save();
    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project', message: error.message });
  }
});

router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const deleted = await User.deleteOne({ _id: req.params.id });
    if (!deleted.deletedCount) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

router.delete('/projects/:id', auth, adminAuth, async (req, res) => {
  try {
    const deleted = await Project.deleteOne({ _id: req.params.id });
    if (!deleted.deletedCount) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project', message: error.message });
  }
});

module.exports = router;
