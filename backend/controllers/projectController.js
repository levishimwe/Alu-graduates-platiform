const useMongo = !!process.env.MONGO_URI;

let SequelizeProject, SequelizeInteraction;
if (!useMongo) {
  const { Project, Interaction } = require("../models/associations");
  SequelizeProject = Project;
  SequelizeInteraction = Interaction;
}

let MongoProject;
if (useMongo) {
  MongoProject = require('../mongoModels/Project');
}

exports.createProject = async (req, res) => {
  try {
    if (useMongo) {
      const project = new MongoProject({ ...req.body, graduateId: req.user.id });
      await project.save();
      return res.status(201).json(project);
    }

    const project = await SequelizeProject.create({ ...req.body, graduateId: req.user.id });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Create failed", error });
  }
};

exports.updateProject = async (req, res) => {
  try {
    if (useMongo) {
      const project = await MongoProject.findById(req.params.id);
      if (!project || String(project.graduateId) !== String(req.user.id)) {
        return res.status(404).json({ message: "Project not found or unauthorized" });
      }
      Object.assign(project, req.body);
      await project.save();
      return res.json({ message: "Updated successfully" });
    }

    await SequelizeProject.update(req.body, {
      where: { id: req.params.id, graduateId: req.user.id },
    });
    res.json({ message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    if (useMongo) {
      const projects = await MongoProject.find({ status: 'published' }).lean();
      return res.json(projects);
    }

    const projects = await SequelizeProject.findAll({ where: { status: "published" } });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Fetch failed", error });
  }
};

exports.getFeaturedProjects = async (req, res) => {
  try {
    if (useMongo) {
      const projects = await MongoProject.find({ status: 'published', featured: true }).limit(10).lean();
      return res.json(projects);
    }

    const projects = await SequelizeProject.findAll({ 
      where: { status: "published", featured: true },
      limit: 10
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Fetch featured projects failed", error });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    if (useMongo) {
      const project = await MongoProject.findById(req.params.id).lean();
      if (!project) return res.status(404).json({ message: "Project not found" });
      return res.json(project);
    }

    const project = await SequelizeProject.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Fetch project failed", error });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    if (useMongo) {
      const project = await MongoProject.findById(req.params.id);
      if (!project || String(project.graduateId) !== String(req.user.id)) {
        return res.status(404).json({ message: "Project not found or unauthorized" });
      }
      await MongoProject.deleteOne({ _id: req.params.id });
      return res.json({ message: "Project deleted successfully" });
    }

    const deleted = await SequelizeProject.destroy({
      where: { id: req.params.id, graduateId: req.user.id }
    });
    if (!deleted) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error });
  }
};

exports.incrementViews = async (req, res) => {
  try {
    if (useMongo) {
      const project = await MongoProject.findById(req.params.id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      project.views = (project.views || 0) + 1;
      await project.save();
      return res.json({ message: "Views incremented successfully" });
    }

    const project = await SequelizeProject.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    await SequelizeProject.increment('views', {
      where: { id: req.params.id }
    });
    res.json({ message: "Views incremented successfully" });
  } catch (error) {
    res.status(500).json({ message: "Increment views failed", error });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    if (useMongo) {
      const project = await MongoProject.findById(req.params.id);
      if (!project || String(project.graduateId) !== String(req.user.id)) {
        return res.status(404).json({ message: "Project not found or unauthorized" });
      }
      return res.json({ message: "Media upload endpoint - implement file handling" });
    }

    const project = await SequelizeProject.findOne({
      where: { id: req.params.id, graduateId: req.user.id }
    });
    
    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }
    
    res.json({ message: "Media upload endpoint - implement file handling" });
  } catch (error) {
    res.status(500).json({ message: "Media upload failed", error });
  }
};