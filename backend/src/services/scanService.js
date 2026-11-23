
import path from "node:path";
import prisma from "../config/database.js";
import pythonScanner from "./pythonScannerService.js";

function calculateSecurityScore(findings) {
  const deductions = {
    CRITICAL: 25,
    HIGH: 15,
    MEDIUM: 7,
    LOW: 3,
    INFO: 1,
  };

  const totalDeduction = findings.reduce((total, finding) => {
    const severity = String(finding.severity || "LOW").toUpperCase();
    return total + (deductions[severity] || 0);
  }, 0);

  return Math.max(0, Math.min(100, 100 - totalDeduction));
}

async function createScan({ projectId, userId, language, code, filename }) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const normalizedLanguage = String(language || "javascript").toLowerCase();

  if (!["javascript", "js"].includes(normalizedLanguage)) {
    throw new Error(
      "Only JavaScript scanning is currently supported."
    );
  }

  if (!code || typeof code !== "string" || !code.trim()) {
    throw new Error("Source code is required.");
  }

  const safeFilename = path.basename(filename || "source.js");

  const scan = await prisma.scan.create({
    data: {
      projectId,
      language: "javascript",
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    const report = await pythonScanner.scanSourceCode({
      code,
      filename: safeFilename,
    });

    if (!Array.isArray(report.findings)) {
      throw new Error("Scanner returned an invalid findings list.");
    }

    const file = await prisma.file.create({
      data: {
        scanId: scan.id,
        path: safeFilename,
        language: "javascript",
        size: Buffer.byteLength(code, "utf8"),
      },
    });

    const findings = report.findings.map((finding) => ({
      scanId: scan.id,
      fileId: file.id,
      type: String(finding.type || "Unknown vulnerability"),
      severity: String(finding.severity || "LOW").toUpperCase(),
      confidence: Number.isFinite(Number(finding.confidence))
        ? Number(finding.confidence)
        : 0.5,
      cwe: finding.cwe ? String(finding.cwe) : null,
      lineStart: Number.isInteger(Number(finding.line))
        ? Number(finding.line)
        : null,
      lineEnd: Number.isInteger(Number(finding.line))
        ? Number(finding.line)
        : null,
      message: String(finding.message || "No description provided."),
      recommendation: finding.recommendation
        ? String(finding.recommendation)
        : null,
    }));

    await prisma.$transaction(async (tx) => {
      if (findings.length > 0) {
        await tx.finding.createMany({
          data: findings,
        });
      }

      await tx.scan.update({
        where: { id: scan.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          securityScore: calculateSecurityScore(report.findings),
        },
      });
    });

    return await prisma.scan.findUnique({
      where: { id: scan.id },
      include: {
        files: {
          include: {
            findings: true,
          },
        },
        findings: true,
      },
    });
  } catch (error) {
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

async function getProjectScans({ projectId, userId }) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return prisma.scan.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          findings: true,
          files: true,
        },
      },
    },
  });
}

async function getScanById({ scanId, userId }) {
  return prisma.scan.findFirst({
    where: {
      id: scanId,
      project: {
        userId,
      },
    },
    include: {
      files: {
        include: {
          findings: true,
        },
      },
      findings: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export default {
  createScan,
  getProjectScans,
  getScanById,
};
