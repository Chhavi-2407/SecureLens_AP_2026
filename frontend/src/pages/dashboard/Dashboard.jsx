
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Clock3,
  RefreshCw,
} from "lucide-react";

import StatCard from "../../components/dashboard/StatCard";
import RecentScans from "../../components/dashboard/RecentScans";
import VulnerabilityChart from "../../components/dashboard/VulnerabilityChart";

import projectService from "../../services/projectService";
import scanService from "../../services/scanService";

const SEVERITY_COLORS = {
  Critical: "#ef646b",
  High: "#f59e62",
  Medium: "#e9c76b",
  Low: "#48c9a5",
};

function getSeverityLabel(findings) {
  if (findings.some((f) => f.severity?.toUpperCase() === "CRITICAL")) {
    return "Critical";
  }
  if (findings.some((f) => f.severity?.toUpperCase() === "HIGH")) {
    return "High";
  }
  if (findings.some((f) => f.severity?.toUpperCase() === "MEDIUM")) {
    return "Medium";
  }
  if (findings.some((f) => f.severity?.toUpperCase() === "LOW")) {
    return "Low";
  }
  return "None";
}

function formatDate(date) {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLastSevenDays(scans) {
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const dayScans = scans.filter((scan) => {
      const scanDate = new Date(scan.createdAt || scan.startedAt);
      return scanDate.toDateString() === date.toDateString();
    });

    days.push({
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      scans: dayScans.length,
      findings: dayScans.reduce(
        (total, scan) => total + (scan.findings?.length || 0),
        0
      ),
    });
  }

  return days;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const projectData = await projectService.getAll();
      setProjects(projectData);

      // Fetch scan records for all projects.
      const scanGroups = await Promise.all(
        projectData.map(async (project) => {
          try {
            const projectScans = await scanService.getProjectScans(project.id);

            return projectScans.map((scan) => ({
              ...scan,
              projectName: project.name,
            }));
          } catch (err) {
            console.error(
              `Could not load scans for ${project.name}:`,
              err
            );
            return [];
          }
        })
      );

      const allScans = scanGroups
        .flat()
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.startedAt) -
            new Date(a.createdAt || a.startedAt)
        );

      // Fetch full details to calculate severity and findings.
      const detailedScans = await Promise.all(
        allScans.map(async (scan) => {
          try {
            const details = await scanService.getScanById(scan.id);

            return {
              ...details,
              projectName: scan.projectName,
            };
          } catch (err) {
            console.error(`Could not load scan ${scan.id}:`, err);

            return {
              ...scan,
              findings: [],
            };
          }
        })
      );

      setScans(detailedScans);
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err.response?.data?.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  const completedScans = scans.filter(
    (scan) => scan.status === "COMPLETED"
  );

  const allFindings = completedScans.flatMap(
    (scan) => scan.findings || []
  );

  const totalFindings = allFindings.length;

  const criticalCount = allFindings.filter(
    (f) => f.severity?.toUpperCase() === "CRITICAL"
  ).length;

  const highCount = allFindings.filter(
    (f) => f.severity?.toUpperCase() === "HIGH"
  ).length;

  const mediumCount = allFindings.filter(
    (f) => f.severity?.toUpperCase() === "MEDIUM"
  ).length;

  const lowCount = allFindings.filter(
    (f) => f.severity?.toUpperCase() === "LOW"
  ).length;

  const averageScore =
    completedScans.length > 0
      ? Math.round(
          completedScans.reduce(
            (total, scan) => total + (scan.securityScore ?? 0),
            0
          ) / completedScans.length
        )
      : null;

  const severityBreakdown = [
    { name: "Critical", value: criticalCount, color: SEVERITY_COLORS.Critical },
    { name: "High", value: highCount, color: SEVERITY_COLORS.High },
    { name: "Medium", value: mediumCount, color: SEVERITY_COLORS.Medium },
    { name: "Low", value: lowCount, color: SEVERITY_COLORS.Low },
  ];

  const overviewStats = [
    {
      label: "Total scans",
      value: scans.length,
      change: `${completedScans.length} completed`,
      icon: "scan",
      tone: "blue",
    },
    {
      label: "Critical findings",
      value: criticalCount,
      change: "Immediate attention",
      icon: "critical",
      tone: "red",
    },
    {
      label: "High severity",
      value: highCount,
      change: "High priority issues",
      icon: "high",
      tone: "orange",
    },
    {
      label: "Projects monitored",
      value: projects.length,
      change: "Registered projects",
      icon: "projects",
      tone: "green",
    },
  ];

  const scanActivity = useMemo(
    () => getLastSevenDays(completedScans),
    [scans]
  );

  const recentScans = scans.slice(0, 5).map((scan) => ({
    id: scan.id,
    project: scan.projectName || "Unknown project",
    language: scan.language || "N/A",
    date: formatDate(scan.createdAt || scan.startedAt),
    findings: scan.findings?.length || 0,
    severity: getSeverityLabel(scan.findings || []),
    status: scan.status,
  }));

  const hasCompletedScans = completedScans.length > 0;

  if (loading) {
    return (
      <div className="dashboard-page">
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            color: "#48c9a5",
          }}
        >
          <RefreshCw size={28} />
          <p>Loading your security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="page-intro">
        <div>
          <span className="eyebrow">SECURITY WORKSPACE</span>
          <h1>Welcome to SecureLens</h1>
          <p>
            Monitor your projects and identify security vulnerabilities.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/scans/history")}
        >
          <Clock3 size={16} /> Scan history
        </button>
      </section>

      {error && (
        <div className="panel" style={{ padding: "16px", marginBottom: "20px" }}>
          <p style={{ color: "#ff647c" }}>{error}</p>
          <button className="secondary-button" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      )}

      <section className="security-overview">
        <div className="security-score-block">
          <div className="score-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <span className="score-label">OVERALL SECURITY SCORE</span>

            <div className="score-line">
              <strong>{averageScore ?? "—"}</strong>
              <span>/100</span>
            </div>

            <p>
              {hasCompletedScans
                ? `Average score across ${completedScans.length} completed scans.`
                : "Run your first security scan to calculate your security score."}
            </p>
          </div>
        </div>

        <div className="score-progress-wrap">
          <div className="score-progress-label">
            <span>Security posture</span>
            <strong>
              {averageScore == null
                ? "Not assessed"
                : averageScore >= 80
                  ? "Good"
                  : averageScore >= 60
                    ? "Needs improvement"
                    : "At risk"}
            </strong>
          </div>

          <div className="score-progress">
            <span
              style={{
                width: `${averageScore ?? 0}%`,
              }}
            />
          </div>

          <span className="score-footnote">
            {hasCompletedScans
              ? `${completedScans.length} completed scans analyzed`
              : "No completed scans available"}
          </span>
        </div>
      </section>

      <section className="stats-grid">
        {overviewStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="dashboard-grid">
        <VulnerabilityChart data={scanActivity} />

        <section className="panel severity-panel">
          <div className="panel-heading">
            <div>
              <h2>Findings by severity</h2>
              <p>Across all completed scans</p>
            </div>

            <button
              className="icon-button"
              aria-label="View vulnerabilities"
              onClick={() => navigate("/vulnerabilities")}
            >
              <ArrowUpRight size={17} />
            </button>
          </div>

          <div className="severity-total">
            <strong>{totalFindings}</strong>
            <span>Total findings</span>
          </div>

          <div className="severity-stack">
            {severityBreakdown.map((item) => (
              <span
                key={item.name}
                style={{
                  width:
                    totalFindings > 0
                      ? `${(item.value / totalFindings) * 100}%`
                      : "0%",
                  background: item.color,
                }}
              />
            ))}
          </div>

          <div className="severity-list">
            {severityBreakdown.map((item) => (
              <div className="severity-row" key={item.name}>
                <span>
                  <i style={{ background: item.color }} />
                  {item.name}
                </span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>

      <RecentScans scans={recentScans} />

      <section className="bottom-callout">
        <div className="callout-icon">
          <ShieldCheck size={19} />
        </div>

        <div>
          <strong>Ready to secure your code?</strong>
          <p>
            Create a project and run your next security assessment.
          </p>
        </div>

        <button onClick={() => navigate("/scans/new")}>
          New scan <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}
