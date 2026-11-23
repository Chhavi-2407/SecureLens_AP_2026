import express from "express";

import scanController from "../controllers/scanController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, scanController.createScan);

router.get(
  "/project/:projectId",
  authMiddleware,
  scanController.getProjectScans
);

router.get("/:id", authMiddleware, scanController.getScan);

export default router;