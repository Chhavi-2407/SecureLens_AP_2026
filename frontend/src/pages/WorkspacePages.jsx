
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Search,
  FolderKanban,
  ScanSearch,
  ShieldAlert,
  ArrowUpRight,
  Code2,
  Play,
  User,
  Bell,
  Lock,
  ChevronRight,
  FileCode2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";

const demoProjects = [
  { id: "1", name: "E-Commerce API", description: "Node.js REST API security assessment", language: "JavaScript", scans: 12, score: 82, status: "Completed" },
  { id: "2", name: "Payment Service", description: "Payment processing backend", language: "Python", scans: 8, score: 91, status: "Completed" },
  { id: "3", name: "Student Portal", description: "University management application", language: "Java", scans: 3, score: 67, status: "Completed" },
];

const demoScans = [
  { id: "SC-1042", project: "E-Commerce API", date: "Nov 19, 2026", language: "JavaScript", findings: 14, critical: 2, high: 4, status: "Completed", score: 82 },
  { id: "SC-1041", project: "Payment Service", date: "Nov 18, 2026", language: "Python", findings: 6, critical: 0, high: 2, status: "Completed", score: 91 },
  { id: "SC-1040", project: "Student Portal", date: "Nov 17, 2026", language: "Java", findings: 21, critical: 4, high: 7, status: "Completed", score: 67 },
];

const demoFindings = [
  { id: "VUL-001", title: "SQL Injection", severity: "Critical", file: "src/database/query.js", line: 42, cwe: "CWE-89", project: "E-Commerce API" },
  { id: "VUL-002", title: "Cross-Site Scripting (XSS)", severity: "High", file: "src/controllers/user.js", line: 86, cwe: "CWE-79", project: "E-Commerce API" },
  { id: "VUL-003", title: "Hardcoded Secret", severity: "High", file: "config/database.js", line: 12, cwe: "CWE-798", project: "Payment Service" },
  { id: "VUL-004", title: "Command Injection", severity: "Critical", file: "src/utils/runner.js", line: 31, cwe: "CWE-78", project: "Student Portal" },
  { id: "VUL-005", title: "Path Traversal", severity: "Medium", file: "src/files/download.js", line: 54, cwe: "CWE-22", project: "E-Commerce API" },
];

function PageHeader({ eyebrow = "WORKSPACE", title, description, action }) {
  return (
    <div className="workspace-header">
      <div>
        <div className="workspace-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function Button({ children, onClick, secondary = false }) {
  return (
    <button className={secondary ? "ui-button secondary" : "ui-button"} onClick={onClick}>
      {children}
    </button>
  );
}

function Status({ value }) {
  const cls = value.toLowerCase().replaceAll(" ", "-");
  return <span className={`status-pill ${cls}`}>{value}</span>;
}

function Severity({ value }) {
  return <span className={`severity-pill ${value.toLowerCase()}`}>{value}</span>;
}

function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <FolderKanban size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Projects() {
  const [projects, setProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("securelens_demo_projects")) || demoProjects;
    } catch {
      return demoProjects;
    }
  });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  function createProject(e) {
    e.preventDefault();
    const project = {
      id: String(Date.now()),
      name,
      description,
      language: "Not specified",
      scans: 0,
      score: null,
      status: "Not scanned",
    };
    const next = [project, ...projects];
    setProjects(next);
    localStorage.setItem("securelens_demo_projects", JSON.stringify(next));
    setName("");
    setDescription("");
    setShowForm(false);
  }

  const filtered = projects.filter((p) =>
    `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Projects"
        description="Manage your codebases and security assessment targets."
        action={<Button onClick={() => setShowForm(!showForm)}><Plus size={17} /> New project</Button>}
      />

      {showForm && (
        <form className="panel project-form" onSubmit={createProject}>
          <h3>Create a project</h3>
          <input required placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="form-actions">
            <Button secondary onClick={() => setShowForm(false)}>Cancel</Button>
            <button className="ui-button" type="submit">Create project</button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <div className="search-field"><Search size={17} /><input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <span className="muted-text">{filtered.length} projects</span>
      </div>

      <div className="project-grid">
        {filtered.map((p) => (
          <article className="panel project-card" key={p.id}>
            <div className="project-card-top">
              <div className="project-icon"><FolderKanban size={21} /></div>
              <Status value={p.status} />
            </div>
            <h3>{p.name}</h3>
            <p>{p.description || "No description provided."}</p>
            <div className="project-meta">
              <span><Code2 size={14} /> {p.language}</span>
              <span><ScanSearch size={14} /> {p.scans} scans</span>
            </div>
            <div className="project-card-bottom">
              <span className="muted-text">{p.score == null ? "No score yet" : `Security score: ${p.score}/100`}</span>
              <button className="icon-text-button" onClick={() => navigate(`/projects/${p.id}`)}>View project <ArrowUpRight size={15} /></button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState title="No projects found" description="Try another search or create a project." />}
    </>
  );
}

export function ProjectDetails() {
  const { id } = useParams();
  const project = demoProjects.find((p) => p.id === id) || {
    id, name: "New project", description: "Your project workspace", language: "Not specified", scans: 0, score: null, status: "Not scanned"
  };
  const navigate = useNavigate();

  return (
    <>
      <PageHeader eyebrow="PROJECT DETAILS" title={project.name} description={project.description} action={<Button onClick={() => navigate("/scans/new") }><Play size={16} /> Run scan</Button>} />
      <div className="stats-grid">
        <div className="panel stat-panel"><span>Security score</span><strong>{project.score ?? "--"}</strong><small>Out of 100</small></div>
        <div className="panel stat-panel"><span>Total scans</span><strong>{project.scans}</strong><small>Recorded assessments</small></div>
        <div className="panel stat-panel"><span>Language</span><strong className="stat-word">{project.language}</strong><small>Detected project language</small></div>
      </div>
      <div className="panel section-panel">
        <h3>Recent scans</h3>
        <p className="muted-text">Scan history associated with this project.</p>
        <ScanTable rows={demoScans.filter((s) => s.project === project.name)} />
      </div>
    </>
  );
}

export function NewScan() {
  const [project, setProject] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  function handleFile(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setFileName(selected.name);
    const reader = new FileReader();
    reader.onload = () => setCode(String(reader.result || ""));
    reader.readAsText(selected);
  }

  function submitScan(e) {
    e.preventDefault();
    if (!project || !code.trim()) {
      setMessage("Choose a project and provide source code before continuing.");
      return;
    }
    setMessage("Your scan request is ready. Backend scan execution will be connected in the integration stage.");
  }

  return (
    <>
      <PageHeader title="New security scan" description="Submit source code for static security analysis." />
      <form className="scan-layout" onSubmit={submitScan}>
        <div className="panel section-panel">
          <h3><Code2 size={18} /> Scan configuration</h3>
          <label>Project</label>
          <select value={project} onChange={(e) => setProject(e.target.value)} required>
            <option value="">Select a project</option>
            {demoProjects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <label>Programming language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {["JavaScript", "Python", "Java", "C", "Go"].map((l) => <option key={l}>{l}</option>)}
          </select>
          <label>Source file (optional)</label>
          <input type="file" accept=".js,.jsx,.py,.java,.c,.h,.go,.txt" onChange={handleFile} />
          {fileName && <div className="file-selected"><FileCode2 size={16} /> {fileName}</div>}
          <label>Or paste source code</label>
          <textarea className="code-input" spellCheck="false" value={code} onChange={(e) => setCode(e.target.value)} placeholder={"// Paste code here\nfunction getUser(id) {\n  return db.query('SELECT * FROM users WHERE id=' + id);\n}"} />
          <Button><Play size={16} /> Submit scan</Button>
          {message && <p className="form-message">{message}</p>}
        </div>
        <aside className="panel scan-info">
          <ShieldAlert size={25} />
          <h3>What will be analyzed?</h3>
          <ul>
            <li>SQL injection patterns</li>
            <li>Cross-site scripting risks</li>
            <li>Command injection patterns</li>
            <li>Hardcoded secrets</li>
            <li>Path traversal risks</li>
          </ul>
          <p className="muted-text">Detection capabilities depend on the language rules currently enabled in the scanner.</p>
        </aside>
      </form>
    </>
  );
}

function ScanTable({ rows }) {
  if (!rows.length) return <EmptyState title="No scans yet" description="Run your first scan to see results here." />;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Scan ID</th><th>Project</th><th>Date</th><th>Findings</th><th>Status</th><th>Score</th><th></th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td className="mono">{s.id}</td><td>{s.project}</td><td>{s.date}</td>
              <td>{s.findings}</td><td><Status value={s.status} /></td><td>{s.score}/100</td>
              <td><Link className="table-link" to={`/scans/${s.id}`}>Details <ChevronRight size={14} /></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScanHistory() {
  const [search, setSearch] = useState("");
  const rows = demoScans.filter((s) => `${s.id} ${s.project}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageHeader title="Scan history" description="Review previous security assessments and their results." action={<Link className="ui-button" to="/scans/new"><Plus size={16} /> New scan</Link>} />
      <div className="toolbar"><div className="search-field"><Search size={17} /><input placeholder="Search scans..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><span className="muted-text">{rows.length} scans</span></div>
      <div className="panel section-panel"><ScanTable rows={rows} /></div>
    </>
  );
}

export function ScanResults() {
  const { id } = useParams();
  const scan = demoScans.find((s) => s.id === id) || demoScans[0];
  const findings = demoFindings.filter((f) => f.project === scan.project);
  return (
    <>
      <PageHeader eyebrow="SCAN REPORT" title={`Scan ${id}`} description={`${scan.project} · ${scan.date}`} action={<Status value={scan.status} />} />
      <div className="stats-grid">
        <div className="panel stat-panel"><span>Security score</span><strong>{scan.score}/100</strong><small>Overall assessment</small></div>
        <div className="panel stat-panel"><span>Total findings</span><strong>{scan.findings}</strong><small>Detected issues</small></div>
        <div className="panel stat-panel"><span>Critical issues</span><strong className="danger-text">{scan.critical}</strong><small>Immediate attention</small></div>
      </div>
      <div className="panel section-panel"><h3>Detected vulnerabilities</h3><FindingTable rows={findings} /></div>
    </>
  );
}

function FindingTable({ rows }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Vulnerability</th><th>Severity</th><th>File</th><th>Line</th><th>CWE</th><th></th></tr></thead>
        <tbody>{rows.map((f) => (
          <tr key={f.id}>
            <td><strong>{f.title}</strong><div className="muted-text">{f.id}</div></td>
            <td><Severity value={f.severity} /></td><td className="mono">{f.file}</td><td>{f.line}</td><td>{f.cwe}</td>
            <td><Link className="table-link" to={`/vulnerabilities/${f.id}`}>View <ChevronRight size={14} /></Link></td>
          </tr>
        ))}</tbody>
      </table>
      {!rows.length && <EmptyState title="No findings in this demo report" description="This report has no matching sample findings." />}
    </div>
  );
}

export function Vulnerabilities() {
  const [severity, setSeverity] = useState("All");
  const [search, setSearch] = useState("");
  const filtered = demoFindings.filter((f) =>
    (severity === "All" || f.severity === severity) &&
    `${f.title} ${f.file} ${f.project}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <PageHeader title="Vulnerabilities" description="Explore and prioritize security findings across your projects." />
      <div className="stats-grid">
        <div className="panel stat-panel"><span>Critical</span><strong className="danger-text">2</strong><small>Immediate action</small></div>
        <div className="panel stat-panel"><span>High</span><strong>2</strong><small>High priority</small></div>
        <div className="panel stat-panel"><span>Medium</span><strong>1</strong><small>Review recommended</small></div>
      </div>
      <div className="toolbar">
        <div className="search-field"><Search size={17} /><input placeholder="Search vulnerabilities..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}><option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
      </div>
      <div className="panel section-panel"><FindingTable rows={filtered} /></div>
    </>
  );
}

export function VulnerabilityDetails() {
  const { id } = useParams();
  const finding = demoFindings.find((f) => f.id === id) || demoFindings[0];
  return (
    <>
      <PageHeader eyebrow="FINDING DETAILS" title={finding.title} description={`${finding.id} · ${finding.project}`} action={<Severity value={finding.severity} />} />
      <div className="detail-grid">
        <div className="panel section-panel">
          <h3>Finding overview</h3>
          <div className="detail-row"><span>Vulnerability</span><strong>{finding.title}</strong></div>
          <div className="detail-row"><span>Severity</span><Severity value={finding.severity} /></div>
          <div className="detail-row"><span>CWE reference</span><strong>{finding.cwe}</strong></div>
          <div className="detail-row"><span>File</span><strong className="mono">{finding.file}</strong></div>
          <div className="detail-row"><span>Line</span><strong>{finding.line}</strong></div>
          <h3 className="subheading">Recommended next steps</h3>
          <p className="muted-text">Review the affected code, validate user-controlled input, and apply an appropriate secure coding pattern. Re-run the scan after remediation.</p>
        </div>
        <div className="panel section-panel">
          <h3><FileCode2 size={18} /> Source location</h3>
          <pre className="code-preview">{`// ${finding.file}\n\n// Review the potentially unsafe operation\n// at line ${finding.line}.\n\n// Apply input validation and safe APIs.`}</pre>
          <p className="muted-text">Sample source preview. Actual source snippets will be loaded from scan results after backend integration.</p>
        </div>
      </div>
    </>
  );
}


export function Settings() {
  const { user, logout, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState(
    user?.scanNotifications ?? true
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    setName(user?.name || "");
    setNotifications(user?.scanNotifications ?? true);
  }, [user]);

  async function saveProfile() {
    try {
      setSavingProfile(true);
      setMessage("");
      setError("");

      const updatedUser = await authService.updateProfile(name);

      // Update the authenticated user in the global context.
      // See Step 7 below for updateUser.
      updateUser(updatedUser);

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await authService.changePassword(currentPassword, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function saveNotifications(value) {
    try {
      setSavingNotifications(true);
      setMessage("");
      setError("");

      const updatedUser = await authService.updateNotifications(value);

      updateUser(updatedUser);
      setNotifications(updatedUser.scanNotifications ?? value);
      setMessage("Notification preferences saved successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save notification preferences. Please try again."
      );
    } finally {
      setSavingNotifications(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
      />

      {(message || error) && (
        <div className="panel section-panel">
          <p style={{ color: error ? "#ff647c" : "#48c9a5" }}>
            {error || message}
          </p>
        </div>
      )}

      <div className="settings-grid">
        <div className="panel section-panel">
          <h3><User size={18} /> Profile</h3>

          <label>Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
          />

          <label>Email address</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
          />

          <p className="muted-text">
            Your registered email address cannot be changed here.
          </p>

          <Button
            onClick={saveProfile}
          >
            {savingProfile ? "Saving..." : "Save profile"}
          </Button>
        </div>

        <div className="panel section-panel">
          <h3><Bell size={18} /> Notifications</h3>

          <label className="toggle-row">
            <span>
              <strong>Security scan notifications</strong>
              <small>Save your preference for scan completion updates.</small>
            </span>

            <input
              type="checkbox"
              checked={notifications}
              disabled={savingNotifications}
              onChange={(e) => saveNotifications(e.target.checked)}
            />
          </label>

          <h3 className="subheading">
            <Lock size={18} /> Account security
          </h3>

          <div className="detail-row">
            <span>Authentication</span>
            <strong>JWT secured</strong>
          </div>

          <div className="detail-row">
            <span>Account ID</span>
            <strong className="mono">{user?.id || "N/A"}</strong>
          </div>

          <div className="detail-row">
            <span>Member since</span>
            <strong>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </strong>
          </div>
        </div>

        <div className="panel section-panel">
          <h3><Lock size={18} /> Change password</h3>

          <form onSubmit={handleChangePassword}>
            <label>Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />

            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />

            <button
              className="ui-button"
              type="submit"
              disabled={changingPassword}
            >
              {changingPassword ? "Changing..." : "Change password"}
            </button>
          </form>
        </div>

        <div className="panel section-panel">
          <h3>Account actions</h3>

          <p className="muted-text">
            Sign out of your SecureLens account on this device.
          </p>

          <button
            className="ui-button secondary"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

