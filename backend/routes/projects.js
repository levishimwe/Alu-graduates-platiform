const express = require("express");
const { body, validationResult } = require("express-validator");
const { auth, requireRole } = require("../middleware/auth");
const Project = require("../models/Project");

const router = express.Router();

const parseListField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item) => item && item.trim());
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item) => item && item.trim()) : [];
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

// Create a project (graduates only)
router.post(
  "/",
  auth,
  requireRole("graduate"),
  [
    body("title").trim().isLength({ min: 3, max: 255 }).withMessage("Title must be 3-255 characters"),
    body("description").trim().isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    try {
      const {
        title, description, category, impactArea, technologies,
        fundingGoal, demoUrl, repoUrl, imageUrls, videoUrls, documentUrls,
      } = req.body;

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
        status: "pending",
        fundingGoal: fundingGoal ? parseFloat(fundingGoal) : null,
        currentFunding: 0,
        demoUrl: demoUrl || null,
        repoUrl: repoUrl || null,
        featured: false,
      });

      res.status(201).json({ message: "Project created successfully", project });
    } catch (error) {
      res.status(500).json({ error: "Failed to create project", message: error.message });
    }
  }
);

// Get all published projects (public)
router.get("/", async (req, res) => {
  try {
    const { search, graduateId, category, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status: { $in: ["active", "published"] } };
    if (graduateId) filter.graduateId = graduateId;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("graduateId", "firstName lastName email profileImage")
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(filter),
    ]);

    res.json({ projects, total, currentPage: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects", message: error.message });
  }
});

// Get single project (public)
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "graduateId",
      "firstName lastName email profileImage bio university"
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update a project
router.put("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.graduateId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to update this project" });
    }

    const allowedFields = [
      "title", "description", "category", "impactArea",
      "technologies", "images", "videos", "documents",
      "status", "fundingGoal", "demoUrl", "repoUrl", "featured",
    ];

    allowedFields.forEach((key) => {
      if (req.body[key] !== undefined) {
        if (["technologies", "images", "videos", "documents"].includes(key)) {
          project[key] = parseListField(req.body[key]);
        } else if (key === "fundingGoal") {
          project[key] = req.body[key] ? parseFloat(req.body[key]) : null;
        } else {
          project[key] = req.body[key];
        }
      }
    });

    await project.save();
    res.json({ message: "Project updated successfully", project });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a project
router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.graduateId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to delete this project" });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
