import express from "express";
import projectController from "../controllers/projectController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, projectController.createProject);

router.get("/", authMiddleware, projectController.getUserProjects);

router.get("/:id", authMiddleware, projectController.getProject);

router.delete("/:id", authMiddleware, projectController.deleteProject);

export default router;