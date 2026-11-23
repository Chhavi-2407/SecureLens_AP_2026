
import { spawn } from "node:child_process";
import {
  mkdtemp,
  writeFile,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "../../../");

const scannerDirectory = path.join(projectRoot, "scanner");
const scannerFile = path.join(scannerDirectory, "scanner.py");
const pythonExecutable = path.join(
  scannerDirectory,
  ".venv",
  "bin",
  "python"
);

const MAX_CODE_SIZE = 1024 * 1024;
const SCAN_TIMEOUT = 30000;

function executePython(filePath) {
  return new Promise((resolve, reject) => {
    const process = spawn(
      pythonExecutable,
      [scannerFile, filePath],
      {
        cwd: scannerDirectory,
        shell: false,
        env: {
          ...globalThis.process.env,
          PYTHONUNBUFFERED: "1",
        },
      }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      process.kill("SIGKILL");

      if (!settled) {
        settled = true;
        reject(new Error("Python scanner timed out."));
      }
    }, SCAN_TIMEOUT);

    process.stdout.on("data", (chunk) => {
      stdout += chunk.toString();

      if (stdout.length > 5 * 1024 * 1024) {
        process.kill("SIGKILL");

        if (!settled) {
          settled = true;
          reject(new Error("Scanner output exceeded the allowed size."));
        }
      }
    });

    process.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    process.on("error", (error) => {
      clearTimeout(timeout);

      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    process.on("close", (code) => {
      clearTimeout(timeout);

      if (settled) return;

      settled = true;

      if (code !== 0) {
        try {
          const report = JSON.parse(stdout);

          reject(
            new Error(report.error || "Python scanner failed.")
          );
        } catch {
          reject(
            new Error(stderr || "Python scanner exited with an error.")
          );
        }

        return;
      }

      try {
        const report = JSON.parse(stdout);

        if (report.success === false) {
          throw new Error(report.error || "Scanner failed.");
        }

        resolve(report);
      } catch (error) {
        reject(
          new Error(`Invalid scanner response: ${error.message}`)
        );
      }
    });
  });
}

async function scanSourceCode({ code, filename }) {
  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Source code cannot be empty.");
  }

  if (Buffer.byteLength(code, "utf8") > MAX_CODE_SIZE) {
    throw new Error("Source code exceeds the 1 MB limit.");
  }

  const safeFilename = path.basename(filename || "source.js");

  if (!safeFilename.endsWith(".js") && !safeFilename.endsWith(".jsx")) {
    throw new Error("Only JavaScript (.js and .jsx) files are supported currently.");
  }

  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "securelens-")
  );

  const temporaryFile = path.join(
    temporaryDirectory,
    safeFilename
  );

  try {
    await writeFile(temporaryFile, code, "utf8");

    return await executePython(temporaryFile);
  } finally {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
}

export default {
  scanSourceCode,
};
