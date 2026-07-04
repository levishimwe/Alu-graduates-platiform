const Project = require("../models/Project");
const User = require("../models/User");
const Interaction = require("../models/Interaction");

// Approve a project
exports.approveProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: "published" },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project approved successfully", project });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve project", error: error.message });
  }
};

// Reject a project
exports.rejectProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project rejected successfully", project });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject project", error: error.message });
  }
};

// Get admin dashboard stats
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProjects,
      pendingProjects,
      publishedProjects,
      graduates,
      investors,
      admins,
      recentUsers,
      recentProjects,
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Project.countDocuments({ status: "pending" }),
      Project.countDocuments({ status: "published" }),
      User.countDocuments({ userType: "graduate" }),
      User.countDocuments({ userType: "investor" }),
      User.countDocuments({ userType: "admin" }),
      User.find().sort({ createdAt: -1 }).limit(5).select("-password"),
      Project.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("graduateId", "firstName lastName email"),
    ]);

    res.json({
      totalUsers,
      totalProjects,
      pendingProjects,
      publishedProjects,
      usersByRole: { graduates, investors, admins },
      recentUsers,
      recentProjects,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard", error: error.message });
  }
};

// Get all users with pagination and filters
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, userType, isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (userType) filter.userType = userType;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve users", error: error.message });
  }
};

// Update user active status
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User status updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user status", error: error.message });
  }
};

// Get pending projects for moderation
exports.getPendingProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [projects, totalCount] = await Promise.all([
      Project.find({ status: "pending" })
        .populate("graduateId", "firstName lastName email")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments({ status: "pending" }),
    ]);

    res.json({
      projects,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending projects", error: error.message });
  }
};

// Get platform analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const [
      newUsers,
      newProjects,
      totalInteractions,
      projectsByStatus,
      usersByRole,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: daysAgo } }),
      Project.countDocuments({ createdAt: { $gte: daysAgo } }),
      Interaction.countDocuments({ createdAt: { $gte: daysAgo } }),
      Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: "$userType", count: { $sum: 1 } } }]),
    ]);

    res.json({
      period: parseInt(period),
      newUsers,
      newProjects,
      totalInteractions,
      projectsByStatus,
      usersByRole,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};