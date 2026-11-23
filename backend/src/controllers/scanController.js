
import scanService from "../services/scanService.js";

async function createScan(req, res) {
  try {
    const { projectId, language, code, filename } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required.",
      });
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Source code is required.",
      });
    }

    const scan = await scanService.createScan({
      projectId,
      language,
      code,
      filename,
      userId: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Scan completed successfully.",
      data: scan,
    });
  } catch (error) {
    console.error("Create scan error:", error);

    const clientErrors = [
      "Project not found",
      "Source code is required.",
      "Only JavaScript scanning is currently supported.",
      "Source code exceeds the 1 MB limit.",
      "Only JavaScript (.js and .jsx) files are supported currently.",
      "Source code cannot be empty.",
    ];

    if (clientErrors.includes(error.message)) {
      return res.status(
        error.message === "Project not found" ? 404 : 400
      ).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to execute security scan.",
    });
  }
}

async function getProjectScans(req, res) {
  try {
    const scans = await scanService.getProjectScans({
      projectId: req.params.projectId,
      userId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      data: scans,
    });
  } catch (error) {
    console.error("Get project scans error:", error);

    if (error.message === "Project not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch scans.",
    });
  }
}

async function getScan(req, res) {
  try {
    const scan = await scanService.getScanById({
      scanId: req.params.id,
      userId: req.user.userId,
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: scan,
    });
  } catch (error) {
    console.error("Get scan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch scan.",
    });
  }
}

export default {
  createScan,
  getProjectScans,
  getScan,
};
