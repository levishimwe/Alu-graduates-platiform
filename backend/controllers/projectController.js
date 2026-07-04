const Project = require("../models/Project");
const cloudinary = require("../config/cloudinary");

// Create a project
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, graduateId: req.user.id });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to create project", error: error.message });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, graduateId: req.user.id });
    if (!project) return res.status(404).json({ message: "Project not found or unauthorized" });
    Object.assign(project, req.body);
    await project.save();
    res.json({ message: "Project updated successfully", project });
  } catch (error) {
    res.status(500).json({ message: "Failed to update project", error: error.message });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      graduateId: req.user.id,
    });
    if (!project) return res.status(404).json({ message: "Project not found or unauthorized" });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project", error: error.message });
  }
};

// Get all published projects
exports.getAllProjects = async (req, res) => {
  try {
    const { category, impactArea, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status: "published" };
    if (category) filter.category = category;
    if (impactArea) filter.impactArea = impactArea;
    if (search) filter.$text = { $search: search };

    const [projects, totalCount] = await Promise.all([
      Project.find(filter)
        .populate("graduateId", "firstName lastName email profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(filter),
    ]);

    res.json({
      projects,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
};

// Get featured projects
exports.getFeaturedProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: "published", featured: true })
      .populate("graduateId", "firstName lastName email profileImage")
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch featured projects", error: error.message });
  }
};

// Get single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "graduateId",
      "firstName lastName email profileImage linkedinUrl githubUrl"
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project", error: error.message });
  }
};

// Increment project views
exports.incrementViews = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Views updated", views: project.views });
  } catch (error) {
    res.status(500).json({ message: "Failed to increment views", error: error.message });
  }
};

// Upload project media to Cloudinary
exports.uploadMedia = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, graduateId: req.user.id });
    if (!project) return res.status(404).json({ message: "Project not found or unauthorized" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "alu-platform/projects",
      resource_type: "auto",
    });

    project.images = [...(project.images || []), result.secure_url];
    await project.save();

    res.json({ message: "Media uploaded successfully", url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: "Media upload failed", error: error.message });
  }
};