const Project = require("../models/Project");

exports.trackProjectView = async (projectId) => {
  try {
    await Project.findByIdAndUpdate(projectId, { $inc: { views: 1 } });
  } catch (error) {
    console.error("Failed to track project view:", error.message);
  }
};

exports.trackProjectLike = async (projectId) => {
  try {
    await Project.findByIdAndUpdate(projectId, { $inc: { likes: 1 } });
  } catch (error) {
    console.error("Failed to track project like:", error.message);
  }
};
