import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

import scanRoutes from "./routes/scanRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/scans", scanRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SecureLens API is running",
  });
});

export default app;