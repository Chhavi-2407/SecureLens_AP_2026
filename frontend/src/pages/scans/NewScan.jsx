import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Play,
  Upload,
  FolderKanban,
  Code2,
  ShieldCheck,
  FileCode2,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";

import projectService from "../../services/projectService";
import scanService from "../../services/scanService";

export default function NewScan() {
  const navigate = useNavigate();
  const location = useLocation();

  // Keep a direct reference to Monaco so a scan always reads
  // the editor's current contents, not a potentially stale React state value.
  const editorRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(location.state?.projectId || "");

  // Each project has its own draft. A fresh New Scan page is empty
  // unless it was opened with a specific project selected.
  const [code, setCode] = useState(() => {
    const initialProjectId = location.state?.projectId;
    return initialProjectId
      ? sessionStorage.getItem(`securelens_scan_draft_${initialProjectId}`) ?? ""
      : "";
  });
  const [filename, setFilename] = useState(() => {
    const initialProjectId = location.state?.projectId;
    return initialProjectId
      ? sessionStorage.getItem(`securelens_scan_filename_${initialProjectId}`) ?? "source.js"
      : "source.js";
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  // Save drafts separately for each project. This prevents code from
  // Project A appearing when Project B is selected.
  useEffect(() => {
    if (!projectId) return;

    sessionStorage.setItem(`securelens_scan_draft_${projectId}`, code);
    sessionStorage.setItem(`securelens_scan_filename_${projectId}`, filename);
  }, [projectId, code, filename]);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const result = await projectService.getAll();
        const list = Array.isArray(result) ? result : [];

        if (!active) return;

        setProjects(list);

        if (location.state?.projectId) {
          const selectedId = location.state.projectId;
          setProjectId(selectedId);
          setCode(
            sessionStorage.getItem(`securelens_scan_draft_${selectedId}`) ?? ""
          );
          setFilename(
            sessionStorage.getItem(`securelens_scan_filename_${selectedId}`) ??
              "source.js"
          );
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Could not load projects.");
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, [location.state?.projectId]);

  function handleEditorMount(editor) {
    editorRef.current = editor;
    // Use the selected project's current draft (empty for a new project draft).
    editor.setValue(code);
  }

  function handleProjectChange(nextProjectId) {
    // Save the currently visible editor contents under the project being left.
    if (projectId) {
      const currentCode = editorRef.current?.getValue() ?? code;
      sessionStorage.setItem(
        `securelens_scan_draft_${projectId}`,
        currentCode
      );
      sessionStorage.setItem(
        `securelens_scan_filename_${projectId}`,
        filename
      );
    }

    // Load only the draft belonging to the newly selected project.
    const nextCode = nextProjectId
      ? sessionStorage.getItem(`securelens_scan_draft_${nextProjectId}`) ?? ""
      : "";
    const nextFilename = nextProjectId
      ? sessionStorage.getItem(`securelens_scan_filename_${nextProjectId}`) ??
        "source.js"
      : "source.js";

    setProjectId(nextProjectId);
    setCode(nextCode);
    setFilename(nextFilename);
    setError("");
    editorRef.current?.setValue(nextCode);
  }

  function handleEditorChange(value) {
    setCode(value ?? "");
    if (error) setError("");
  }

  function handleClearCode() {
    editorRef.current?.setValue("");
    setCode("");
    setFilename("source.js");
    setError("");
  }

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!/\.(js|jsx)$/i.test(file.name)) {
      setError("Please upload a .js or .jsx file.");
      event.target.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("File size must be 1 MB or less.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const newCode = String(reader.result || "");
      // Update both Monaco's model and React state.
      editorRef.current?.setValue(newCode);
      setCode(newCode);
      setFilename(file.name);
      setError("");
    };

    reader.onerror = () => {
      setError("Could not read this file.");
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  async function handleRunScan() {
    setError("");

    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    // Read directly from Monaco at click time. This guarantees that
    // the latest pasted/typed/uploaded code is what gets submitted.
    const latestCode = editorRef.current?.getValue() ?? code;

    if (!latestCode.trim()) {
      setError("Please enter or upload source code.");
      return;
    }

    if (new TextEncoder().encode(latestCode).length > 1024 * 1024) {
      setError("Source code must be 1 MB or less.");
      return;
    }

    try {
      setScanning(true);

      const scan = await scanService.createScan({
        projectId,
        language: "javascript",
        filename,
        code: latestCode,
      });

      navigate(`/scans/${scan.id}`, { state: { scan } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "The scan could not be completed. Please try again."
      );
    } finally {
      setScanning(false);
    }
  }

  return (
    <div
      className="new-scan-page"
      style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 32 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <span className="eyebrow">SECURITY ANALYSIS</span>
          <h1 style={{ margin: "8px 0" }}>New Scan</h1>
          <p style={{ color: "var(--text-secondary, #9ca3af)", margin: 0 }}>
            Analyze your source code for security vulnerabilities.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#20b894",
            fontSize: 13,
          }}
        >
          <ShieldCheck size={18} />
          Static analysis engine
        </div>
      </div>

      <section className="panel" style={{ padding: 20, marginBottom: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
          }}
        >
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              <FolderKanban
                size={15}
                style={{ verticalAlign: "middle", marginRight: 7 }}
              />
              Select project
            </span>
            <select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={loadingProjects || scanning}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                background: "var(--surface, #171d25)",
                color: "inherit",
                border: "1px solid var(--border, #303945)",
              }}
            >
              <option value="">
                {loadingProjects ? "Loading projects..." : "Choose a project"}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              <Code2
                size={15}
                style={{ verticalAlign: "middle", marginRight: 7 }}
              />
              Programming language
            </span>
            <select
              value="javascript"
              disabled
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                background: "var(--surface, #171d25)",
                color: "inherit",
                border: "1px solid var(--border, #303945)",
              }}
            >
              <option value="javascript">
                JavaScript (currently supported)
              </option>
            </select>
          </label>
        </div>
      </section>

      <section
        className="panel"
        style={{ overflow: "hidden", marginBottom: 18 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            padding: "14px 18px",
            borderBottom: "1px solid var(--border, #303945)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileCode2 size={18} />
            <strong>{filename}</strong>
            <span
              style={{
                fontSize: 11,
                color: "#20b894",
                background: "rgba(32,184,148,.12)",
                padding: "4px 8px",
                borderRadius: 20,
              }}
            >
              JAVASCRIPT
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={handleClearCode}
              disabled={scanning}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                cursor: scanning ? "not-allowed" : "pointer",
              }}
            >
              <Trash2 size={15} />
              Clear code
            </button>

            <label
              className="secondary-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: scanning ? "not-allowed" : "pointer",
              }}
            >
              <Upload size={15} />
              Upload file
              <input
                type="file"
                accept=".js,.jsx,text/javascript"
                onChange={handleFileUpload}
                hidden
                disabled={scanning}
              />
            </label>
          </div>
        </div>

        <Editor
          height="430px"
          language="javascript"
          theme="vs-dark"
          value={code}
          onMount={handleEditorMount}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 16 },
            readOnly: scanning,
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            padding: "10px 16px",
            borderTop: "1px solid var(--border, #303945)",
            color: "var(--text-secondary, #9ca3af)",
            fontSize: 12,
          }}
        >
          <span>Maximum source size: 1 MB</span>
          <span>
            {new TextEncoder().encode(code).length.toLocaleString()} bytes
          </span>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            color: "#f87171",
            background: "rgba(248,113,113,.1)",
            border: "1px solid rgba(248,113,113,.25)",
            borderRadius: 9,
            padding: 13,
            marginBottom: 16,
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            color: "var(--text-secondary, #9ca3af)",
            fontSize: 12,
            margin: 0,
          }}
        >
          Your code is analyzed statically. It is not executed.
        </p>

        <button
          className="primary-button"
          onClick={handleRunScan}
          disabled={
            scanning || loadingProjects || projects.length === 0 || !projectId
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            minWidth: 150,
            justifyContent: "center",
          }}
        >
          {scanning ? (
            <>
              <Loader2 className="spin" size={17} />
              Scanning...
            </>
          ) : (
            <>
              <Play size={17} />
              Run security scan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
