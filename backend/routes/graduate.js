const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const User = require("../models/User");
const Project = require("../models/Project");

const router = express.Router();

// Get all graduates (public)
router.get("/all", async (_req, res) => {
  try {
    const graduates = await User.find({ userType: "graduate", isActive: true })
      .select("firstName lastName email bio university graduationYear city country profileImage createdAt")
      .sort({ createdAt: -1 });
    res.json(graduates);
  } catch (error) {
    res.status(500).json({ message: "Error fetching graduates", error: error.message });
  }
});

// Graduate dashboard
router.get("/dashboard", auth, requireRole("graduate"), async (req, res) => {
  try {
    const projects = await Project.find({ graduateId: req.user.id }).sort({ createdAt: -1 });

    const totalViews = projects.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = projects.reduce((sum, p) => sum + (p.likes || 0), 0);
    const approvedProjects = projects.filter((p) => ["published", "active"].includes(p.status)).length;
    const pendingProjects = projects.filter((p) => p.status === "pending").length;

    res.json({
      stats: {
        totalProjects: projects.length,
        approvedProjects,
        pendingProjects,
        totalViews,
        totalLikes,
      },
      recentProjects: projects.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get graduate's own projects
router.get("/projects", auth, requireRole("graduate"), async (req, res) => {
  try {
    const projects = await Project.find({ graduateId: req.user.id }).sort({ createdAt: -1 });
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get analytics for a specific project
router.get("/analytics/:projectId", auth, requireRole("graduate"), async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      graduateId: req.user.id,
    });
    if (!project) return res.status(404).json({ message: "Project not found or unauthorized" });

    res.json({
      views: project.views || 0,
      likes: project.likes || 0,
      status: project.status,
      createdAt: project.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
