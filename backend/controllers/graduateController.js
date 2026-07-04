const Project = require("../models/Project");
const Message = require("../models/Message");

// Get graduate dashboard stats
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({ graduateId: userId });

    const totalViews = projects.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalLikes = projects.reduce((acc, p) => acc + (p.likes || 0), 0);

    const recentProjects = await Project.find({ graduateId: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalProjects: projects.length,
      totalViews,
      totalLikes,
      recentProjects,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard", error: error.message });
  }
};

// Get all projects for logged-in graduate
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ graduateId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
};

// Get analytics for a specific project
exports.getAnalytics = async (req, res) => {
  try {

    
    const project = await Project.findOne({
      _id: req.params.projectId,
      graduateId: req.user.id,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }

    res.json({
      projectId: project._id,
      title: project.title,
      views: project.views || 0,
      likes: project.likes || 0,
      status: project.status,
      createdAt: project.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};

// Get messages for the graduate
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ receiverId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
};
