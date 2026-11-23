import prisma from "../config/database.js";

async function createProject({ name, description, repository, userId }) {
  return await prisma.project.create({
    data: {
      name,
      description,
      repository,
      userId,
    },
  });
}

async function getUserProjects(userId) {
  return await prisma.project.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function getProjectById(projectId, userId) {
  return await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });
}

async function deleteProject(projectId, userId) {
  return await prisma.project.deleteMany({
    where: {
      id: projectId,
      userId,
    },
  });
}

export default {
  createProject,
  getUserProjects,
  getProjectById,
  deleteProject,
};