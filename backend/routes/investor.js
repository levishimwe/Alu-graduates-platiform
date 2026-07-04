const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const User = require("../models/User");
const Project = require("../models/Project");
const Interaction = require("../models/Interaction");

const router = express.Router();

// Investor dashboard
router.get("/dashboard", auth, requireRole("investor"), async (_req, res) => {
  try {
    const [featuredProjects, recentProjects] = await Promise.all([
      Project.find({ featured: true, status: "published" })
        .populate("graduateId", "firstName lastName email profileImage")
        .sort({ views: -1 })
        .limit(6),
      Project.find({ status: "published" })
        .populate("graduateId", "firstName lastName email profileImage")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({ featuredProjects, recentProjects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Bookmark a project
router.post("/bookmark/:projectId", auth, requireRole("investor"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const existing = await Interaction.findOne({
      investorId: req.user.id,
      projectId: req.params.projectId,
      type: "bookmark",
    });
    if (existing) return res.status(400).json({ message: "Project already bookmarked" });

    await Interaction.create({
      investorId: req.user.id,
      projectId: req.params.projectId,
      type: "bookmark",
    });

    res.status(201).json({ message: "Project bookmarked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Remove bookmark
router.delete("/bookmark/:projectId", auth, requireRole("investor"), async (req, res) => {
  try {
    const deleted = await Interaction.findOneAndDelete({
      investorId: req.user.id,
      projectId: req.params.projectId,
      type: "bookmark",
    });
    if (!deleted) return res.status(404).json({ message: "Bookmark not found" });
    res.json({ message: "Bookmark removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all bookmarks
router.get("/bookmarks", auth, requireRole("investor"), async (req, res) => {
  try {
    const bookmarks = await Interaction.find({
      investorId: req.user.id,
      type: "bookmark",
    }).populate({
      path: "projectId",
      populate: { path: "graduateId", select: "firstName lastName email profileImage" },
    });
    res.json({ bookmarks });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Express interest in a project
router.post("/express-interest", auth, requireRole("investor"), async (req, res) => {
  try {
    const { projectId, message } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const existing = await Interaction.findOne({
      investorId: req.user.id,
      projectId,
      type: "interest",
    });
    if (existing) return res.status(400).json({ message: "Interest already expressed" });

    await Interaction.create({
      investorId: req.user.id,
      projectId,
      type: "interest",
      message,
    });

    res.status(201).json({ message: "Interest expressed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Contact a graduate
router.post("/contact-graduate", auth, requireRole("investor"), async (req, res) => {
  try {
    const { graduateId, projectId, message } = req.body;

    const graduate = await User.findOne({ _id: graduateId, userType: "graduate", isActive: true });
    if (!graduate) return res.status(404).json({ message: "Graduate not found" });

    await Interaction.create({
      investorId: req.user.id,
      projectId,
      type: "contact",
      message,
    });

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get conversations
router.get("/conversations", auth, requireRole("investor"), async (req, res) => {
  try {
    const interactions = await Interaction.find({
      investorId: req.user.id,
      type: { $in: ["contact", "interest"] },
    })
      .populate({
        path: "projectId",
        populate: { path: "graduateId", select: "firstName lastName email profileImage" },
      })
      .sort({ createdAt: -1 });

    const grouped = interactions.reduce((acc, item) => {
      const key = item.projectId?._id?.toString();
      if (!key) return acc;
      if (!acc[key]) {
        acc[key] = {
          project: item.projectId,
          graduate: item.projectId?.graduateId,
          messages: [],
        };
      }
      acc[key].messages.push({
        id: item._id,
        type: item.type,
        message: item.message,
        createdAt: item.createdAt,
      });
      return acc;
    }, {});

    res.json({ conversations: Object.values(grouped) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
