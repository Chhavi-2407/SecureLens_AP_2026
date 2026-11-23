
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  AlertTriangle,
} from "lucide-react";

import projectService from "../../services/projectService";
import scanService from "../../services/scanService";

function Vulnerabilities() {
  const navigate = useNavigate();

  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("ALL");

  useEffect(() => {
    loadVulnerabilities();
  }, []);

  const loadVulnerabilities = async () => {
    try {
      setLoading(true);
      setError("");

      const projects = await projectService.getAll();

      // First get scans belonging to every project.
      const scanGroups = await Promise.all(
        projects.map(async (project) => {
          try {
            const scans = await scanService.getProjectScans(project.id);

            return scans.map((scan) => ({
              ...scan,
              projectName: project.name,
            }));
          } catch (err) {
            console.error("Could not load project scans:", err);
            return [];
          }
        })
      );

      const allScans = scanGroups.flat();

      // Fetch complete scan details because the scan list
      // only contains finding counts, not complete findings.
      const completedScans = await Promise.all(
        allScans.map(async (scan) => {
          try {
            const details = await scanService.getScanById(scan.id);

            return {
              ...details,
              projectName: scan.projectName,
            };
          } catch (err) {
            console.error("Could not load scan details:", err);
            return null;
          }
        })
      );

      const allFindings = completedScans
        .filter(Boolean)
        .flatMap((scan) =>
          (scan.findings || []).map((finding) => ({
            ...finding,
            projectName: scan.projectName,
            scanId: scan.id,
            scanDate: scan.createdAt || scan.startedAt,
          }))
        );

      setFindings(allFindings);
    } catch (err) {
      console.error("Vulnerability loading error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load vulnerabilities."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      const matchesSeverity =
        severity === "ALL" ||
        finding.severity?.toUpperCase() === severity;

      const searchableText = [
        finding.type,
        finding.cwe,
        finding.message,
        finding.file?.path,
        finding.projectName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        search.toLowerCase()
      );

      return matchesSeverity && matchesSearch;
    });
  }, [findings, severity, search]);

  const countBySeverity = (level) =>
    findings.filter(
      (finding) => finding.severity?.toUpperCase() === level
    ).length;

  const getSeverityColor = (value) => {
    switch (value?.toUpperCase()) {
      case "CRITICAL":
        return "#ff647c";
      case "HIGH":
        return "#f59e0b";
      case "MEDIUM":
        return "#eab308";
      case "LOW":
        return "#34d399";
      default:
        return "#94a3b8";
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <RefreshCw size={28} />
        <p>Loading vulnerabilities...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>SECURITY WORKSPACE</p>
          <h1 style={styles.heading}>Vulnerabilities</h1>
          <p style={styles.muted}>
            All security findings detected across your projects.
          </p>
        </div>

        <button style={styles.refresh} onClick={loadVulnerabilities}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div style={styles.stats}>
        {[
          ["Total findings", findings.length, "#34d399"],
          ["Critical", countBySeverity("CRITICAL"), "#ff647c"],
          ["High", countBySeverity("HIGH"), "#f59e0b"],
          ["Medium", countBySeverity("MEDIUM"), "#eab308"],
          ["Low", countBySeverity("LOW"), "#34d399"],
        ].map(([label, count, color]) => (
          <div key={label} style={styles.statCard}>
            <p style={styles.muted}>{label}</p>
            <h2 style={{ ...styles.statNumber, color }}>{count}</h2>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input
              style={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vulnerability, CWE, file or project..."
            />
          </div>

          <select
            style={styles.select}
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="ALL">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {error ? (
          <div style={styles.empty}>
            <AlertTriangle size={32} color="#ff647c" />
            <p>{error}</p>
            <button style={styles.refresh} onClick={loadVulnerabilities}>
              Try again
            </button>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div style={styles.empty}>
            <ShieldAlert size={40} color="#64748b" />
            <h3>No vulnerabilities found</h3>
            <p>
              {findings.length === 0
                ? "Your completed scans have no recorded findings."
                : "Try changing your search or severity filter."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Vulnerability</th>
                  <th>Severity</th>
                  <th>Project</th>
                  <th>File</th>
                  <th>Line</th>
                  <th>CWE</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredFindings.map((finding, index) => (
                  <tr key={finding.id || `${finding.scanId}-${index}`}>
                    <td>
                      <strong>
                        {finding.type?.replaceAll("_", " ") || "Unknown"}
                      </strong>
                      <p style={styles.small}>
                        {finding.message}
                      </p>
                    </td>

                    <td>
                      <span
                        style={{
                          color: getSeverityColor(finding.severity),
                          fontWeight: 700,
                        }}
                      >
                        {finding.severity}
                      </span>
                    </td>

                    <td>{finding.projectName}</td>

                    <td style={styles.file}>
                      {finding.file?.path || "N/A"}
                    </td>

                    <td>{finding.lineStart ?? "N/A"}</td>

                    <td>{finding.cwe || "N/A"}</td>

                    <td>
                      <button
                        style={styles.viewButton}
                        onClick={() =>
                          navigate(`/vulnerabilities/${finding.id}`)
                        }
                      >
                        <Eye size={15} />
                        View scan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={styles.footer}>
          Showing {filteredFindings.length} of {findings.length} findings
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "32px",
    maxWidth: "1500px",
    margin: "0 auto",
    color: "#e5edf2",
  },
  center: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#34d399",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    marginBottom: "28px",
  },
  eyebrow: {
    color: "#34d399",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "2px",
  },
  heading: {
    fontSize: "32px",
    margin: "8px 0",
  },
  muted: {
    color: "#94a3b8",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#151f29",
    border: "1px solid #293845",
    borderRadius: "12px",
    padding: "20px",
  },
  statNumber: {
    fontSize: "29px",
    margin: "12px 0 0",
  },
  card: {
    background: "#151f29",
    border: "1px solid #293845",
    borderRadius: "13px",
    padding: "24px",
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "24px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: "1 1 280px",
    background: "#101820",
    border: "1px solid #354653",
    borderRadius: "8px",
    padding: "0 12px",
  },
  searchInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e5edf2",
    padding: "13px 0",
  },
  select: {
    background: "#101820",
    color: "#e5edf2",
    border: "1px solid #354653",
    borderRadius: "8px",
    padding: "11px",
  },
  refresh: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#1b2833",
    color: "#e5edf2",
    border: "1px solid #354653",
    borderRadius: "8px",
    padding: "11px 15px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    minWidth: "1050px",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  small: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "6px",
    maxWidth: "350px",
  },
  file: {
    color: "#94a3b8",
    fontSize: "13px",
  },
  viewButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    border: "1px solid #354653",
    color: "#34d399",
    borderRadius: "7px",
    padding: "8px 10px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "45px 15px",
    textAlign: "center",
    color: "#94a3b8",
  },
  footer: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "20px",
  },
};

export default Vulnerabilities;
