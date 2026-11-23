import projectService from "../services/projectService.js";

async function createProject(req, res) {
  try {
    const { name, description, repository } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const project = await projectService.createProject({
      name,
      description,
      repository,
      userId: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
}

async function getUserProjects(req, res) {
  try {
    const projects = await projectService.getUserProjects(
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
}

async function getProject(req, res) {
  try {
    const { id } = req.params;

    const project = await projectService.getProjectById(
      id,
      req.user.userId
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
}

async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    const result = await projectService.deleteProject(
      id,
      req.user.userId
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
}

export default {
  createProject,
  getUserProjects,
  getProject,
  deleteProject,
};