
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  FileCode,
  ArrowLeft,
  RefreshCw,
  Bug,
  CheckCircle,
} from "lucide-react";

import scanService from "../../services/scanService";

function ScanResults() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScan = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await scanService.getScanById(id);
        setScan(data);
      } catch (err) {
        console.error("Failed to load scan:", err);
        setError(
          err.response?.data?.message || "Unable to load scan results."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [id]);

  if (loading) {
    return (
      <div style={styles.center}>
        <RefreshCw size={28} className="spin" />
        <p>Loading scan results...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div style={styles.page}>
        <h2>Unable to load scan</h2>
        <p>{error || "Scan not found."}</p>
        <button style={styles.button} onClick={() => navigate("/scans/new")}>
          Create another scan
        </button>
      </div>
    );
  }

  const findings = scan.findings || [];
  const critical = findings.filter(
    (f) => f.severity?.toUpperCase() === "CRITICAL"
  ).length;
  const high = findings.filter(
    (f) => f.severity?.toUpperCase() === "HIGH"
  ).length;
  const medium = findings.filter(
    (f) => f.severity?.toUpperCase() === "MEDIUM"
  ).length;
  const low = findings.filter(
    (f) => f.severity?.toUpperCase() === "LOW"
  ).length;

  const score = scan.securityScore ?? 0;

  const severityColor = (severity) => {
    switch (severity?.toUpperCase()) {
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

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>SECURITY ANALYSIS</p>
          <h1 style={styles.heading}>Scan Results</h1>
          <p style={styles.muted}>
            {scan.project?.name || "Project scan"} ·{" "}
            {scan.language || "JavaScript"}
          </p>
        </div>

        <span style={styles.status}>
          <CheckCircle size={15} />
          {scan.status}
        </span>
      </div>

      <div style={styles.stats}>
        <div style={styles.card}>
          <p style={styles.muted}>Security Score</p>
          <h2 style={styles.score}>{score}/100</h2>
          <p style={styles.small}>Overall assessment</p>
        </div>

        <div style={styles.card}>
          <p style={styles.muted}>Total Findings</p>
          <h2 style={styles.score}>{findings.length}</h2>
          <p style={styles.small}>Detected vulnerabilities</p>
        </div>

        <div style={styles.card}>
          <p style={styles.muted}>Critical Issues</p>
          <h2 style={{ ...styles.score, color: "#ff647c" }}>
            {critical}
          </h2>
          <p style={styles.small}>Immediate attention</p>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Severity Breakdown</h3>

        <div style={styles.severityGrid}>
          {[
            ["Critical", critical, "#ff647c"],
            ["High", high, "#f59e0b"],
            ["Medium", medium, "#eab308"],
            ["Low", low, "#34d399"],
          ].map(([label, count, color]) => (
            <div key={label} style={styles.severityItem}>
              <span style={{ color }}>{label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>
          <Bug size={19} /> Detected Vulnerabilities
        </h3>

        {findings.length === 0 ? (
          <div style={styles.empty}>
            <ShieldCheck size={38} color="#34d399" />
            <h3>No vulnerabilities detected</h3>
            <p>Your scanner did not identify any security issues in this scan.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Vulnerability</th>
                  <th>Severity</th>
                  <th>CWE</th>
                  <th>Line</th>
                </tr>
              </thead>

              <tbody>
                {findings.map((finding, index) => (
                  <tr key={finding.id || index}>
                    <td>
                      <strong>{finding.type?.replaceAll("_", " ")}</strong>
                      <p style={styles.small}>
                        {finding.message}
                      </p>
                    </td>

                    <td>
                      <span
                        style={{
                          color: severityColor(finding.severity),
                          fontWeight: 700,
                        }}
                      >
                        {finding.severity}
                      </span>
                    </td>

                    <td>{finding.cwe || "N/A"}</td>
                    <td>{finding.lineStart ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {findings.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <AlertTriangle size={19} /> Recommendations
          </h3>

          {findings.map((finding, index) => (
            <div key={finding.id || index} style={styles.recommendation}>
              <strong>{finding.type?.replaceAll("_", " ")}</strong>
              <p>{finding.recommendation || "No recommendation available."}</p>
            </div>
          ))}
        </div>
      )}

      <div style={styles.actions}>
        <button style={styles.button} onClick={() => navigate("/scans/new")}>
          <ArrowLeft size={17} /> New Scan
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => navigate("/scans/history")}
        >
          View Scan History
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "32px",
    color: "#e5edf2",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  center: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#34d399",
    gap: "12px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "32px",
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
  small: {
    color: "#94a3b8",
    fontSize: "13px",
    marginTop: "8px",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#34d399",
    background: "#123b32",
    padding: "9px 14px",
    borderRadius: "20px",
    fontSize: "13px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },
  card: {
    background: "#151f29",
    border: "1px solid #293845",
    borderRadius: "13px",
    padding: "24px",
    marginBottom: "22px",
  },
  score: {
    fontSize: "32px",
    margin: "12px 0",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: 0,
    marginBottom: "22px",
  },
  severityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "16px",
  },
  severityItem: {
    display: "flex",
    justifyContent: "space-between",
    background: "#101820",
    padding: "15px",
    borderRadius: "9px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    minWidth: "650px",
  },
  empty: {
    textAlign: "center",
    padding: "30px 10px",
    color: "#94a3b8",
  },
  recommendation: {
    padding: "15px 0",
    borderTop: "1px solid #293845",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "25px",
  },
  button: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#30c6a5",
    color: "#071b18",
    border: "none",
    borderRadius: "8px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    background: "#1b2833",
    color: "#e5edf2",
    border: "1px solid #354653",
    borderRadius: "8px",
    padding: "12px 18px",
    cursor: "pointer",
  },
};

export default ScanResults;
