const Interaction = require("../models/Interaction");

// Bookmark a project
exports.bookmarkProject = async (req, res) => {
  try {
    const existing = await Interaction.findOne({
      investorId: req.user.id,
      projectId: req.params.projectId,
      type: "bookmark",
    });
    if (existing) {
      return res.status(400).json({ message: "Project already bookmarked" });
    }
    await Interaction.create({
      investorId: req.user.id,
      projectId: req.params.projectId,
      type: "bookmark",
    });
    res.status(201).json({ message: "Project bookmarked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to bookmark project", error: error.message });
  }
};

// Remove a bookmark
exports.removeBookmark = async (req, res) => {
  try {
    const deleted = await Interaction.findOneAndDelete({
      investorId: req.user.id,
      projectId: req.params.projectId,
      type: "bookmark",
    });
    if (!deleted) return res.status(404).json({ message: "Bookmark not found" });
    res.json({ message: "Bookmark removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove bookmark", error: error.message });
  }
};

// Contact a graduate
exports.contactGraduate = async (req, res) => {
  try {
    const { projectId, message } = req.body;
    await Interaction.create({
      investorId: req.user.id,
      projectId,
      type: "contact",
      message,
    });
    res.status(201).json({ message: "Graduate contacted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to contact graduate", error: error.message });
  }
};

// Express interest in a project
exports.expressInterest = async (req, res) => {
  try {

    const { projectId, message } = req.body;
    const existing = await Interaction.findOne({
      investorId: req.user.id,
      projectId,
      type: "interest",
    });
    if (existing) {
      return res.status(400).json({ message: "Interest already expressed for this project" });
    }
    await Interaction.create({
      investorId: req.user.id,
      projectId,
      type: "interest",
      message,
    });
    
    res.status(201).json({ message: "Interest expressed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to express interest", error: error.message });
  }
};

// Get investor dashboard
exports.getDashboard = async (req, res) => {
  try {
    const investorId = req.user.id;

    const [bookmarksCount, interestsCount, recentBookmarks] = await Promise.all([
      Interaction.countDocuments({ investorId, type: "bookmark" }),
      Interaction.countDocuments({ investorId, type: "interest" }),
      Interaction.find({ investorId, type: "bookmark" })
        .populate({ path: "projectId", populate: { path: "graduateId", select: "firstName lastName email" } })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.json({ totalBookmarks: bookmarksCount, totalInterests: interestsCount, recentBookmarks });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard", error: error.message });
  }
};

// Get all bookmarks
exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Interaction.find({
      investorId: req.user.id,
      type: "bookmark",
    })
      .populate({
        path: "projectId",
        populate: { path: "graduateId", select: "firstName lastName email" },
      })
      .sort({ createdAt: -1 });
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookmarks", error: error.message });
  }
};

// Get all conversations
exports.getConversations = async (req, res) => {
  try {
    const interactions = await Interaction.find({
      investorId: req.user.id,
      type: { $in: ["contact", "interest"] },
    })
      .populate({
        path: "projectId",
        populate: { path: "graduateId", select: "firstName lastName email" },
      })
      .sort({ createdAt: -1 });

    // Group by project
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

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch conversations", error: error.message });
  }
};