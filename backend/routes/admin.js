const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const User = require("../models/User");
const Project = require("../models/Project");

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, requireRole("admin"));

// Get all users
router.get("/users", async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users", message: error.message });
  }
});

// Get all projects
router.get("/projects", async (_req, res) => {
  try {
    const projects = await Project.find()
      .populate("graduateId", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.json({ projects, total: projects.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects", message: error.message });
  }
});

// Update user active status
router.put("/users/:id/status", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: !!req.body.isActive },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User status updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user status", message: error.message });
  }
});

// Update project status or featured flag
router.put("/projects/:id/status", async (req, res) => {
  try {
    const updates = {};
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.featured !== undefined) updates.featured = req.body.featured;

    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project updated successfully", project });
  } catch (error) {
    res.status(500).json({ error: "Failed to update project", message: error.message });
  }
});

// Delete a user
router.delete("/users/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user", message: error.message });
  }
});

// Delete a project
router.delete("/projects/:id", async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project", message: error.message });
  }
});

module.exports = router;
