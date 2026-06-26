const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { Project } = require('../models');
const router = express.Router();

const parseListField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item) => item && item.trim());
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item) => item && item.trim()) : [];
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
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

router.post('/', auth, [
  body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    const { title, description, category, impactArea, technologies, fundingGoal, demoUrl, repoUrl, imageUrls, videoUrls, documentUrls } = req.body;
    const project = await Project.create({
      title,
      description,
      graduateId: req.user.id,
      category: category || null,
      impactArea: impactArea || null,
      technologies: parseListField(technologies),
      images: parseListField(imageUrls),
      videos: parseListField(videoUrls),
      documents: parseListField(documentUrls),
      status: 'active',
      fundingGoal: fundingGoal ? parseFloat(fundingGoal) : null,
      currentFunding: 0,
      demoUrl: demoUrl || null,
      repoUrl: repoUrl || null,
      featured: false
    });

    res.status(201).json({ message: "Project created successfully", project: normalizeProject(project.toObject()) });
  } catch (error) {
    res.status(500).json({ error: "Failed to create project", message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, graduateId } = req.query;
    const filter = { status: { $in: ['active', 'completed'] } };
    if (graduateId) filter.graduateId = graduateId;
    if (search) filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
    const projects = await Project.find(filter).sort({ featured: -1, createdAt: -1 }).lean();
    const normalized = projects.map(normalizeProject);
    res.json({ projects: normalized, total: normalized.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects", message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project: normalizeProject(project) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (String(project.graduateId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Not authorized to update this project" });
    }

    const allowedFields = ['title', 'description', 'category', 'impactArea', 'technologies', 'images', 'videos', 'documents', 'status', 'fundingGoal', 'demoUrl', 'repoUrl', 'featured'];
    allowedFields.forEach((key) => {
      if (req.body[key] !== undefined) {
        if (['technologies', 'images', 'videos', 'documents'].includes(key)) {
          project[key] = parseListField(req.body[key]);
        } else if (key === 'fundingGoal') {
          project[key] = req.body[key] ? parseFloat(req.body[key]) : null;
        } else {
          project[key] = req.body[key];
        }
      }
    });

    await project.save();
    res.json({ message: "Project updated successfully", project: normalizeProject(project.toObject()) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (String(project.graduateId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Not authorized to delete this project" });
    }

    await Project.deleteOne({ _id: req.params.id });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
