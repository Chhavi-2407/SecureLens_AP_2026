
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Plus,
} from "lucide-react";

import projectService from "../../services/projectService";
import scanService from "../../services/scanService";

function ScanHistory() {
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const fetchScanHistory = async () => {
    try {
      setLoading(true);
      setError("");

      // Get all projects belonging to the logged-in user
      const projects = await projectService.getAll();

      // Fetch scans for every project
      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const projectScans = await scanService.getProjectScans(project.id);

            return projectScans.map((scan) => ({
              ...scan,
              projectName: project.name,
            }));
          } catch (err) {
            console.error(
              `Could not fetch scans for project ${project.name}:`,
              err
            );
            return [];
          }
        })
      );

      const allScans = results
        .flat()
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.startedAt) -
            new Date(a.createdAt || a.startedAt)
        );

      setScans(allScans);
    } catch (err) {
      console.error("Scan history error:", err);
      setError(
        err.response?.data?.message || "Unable to load scan history."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      scan.language?.toLowerCase().includes(search.toLowerCase()) ||
      scan.id?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || scan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "#34d399";
      case "RUNNING":
        return "#60a5fa";
      case "FAILED":
        return "#ff647c";
      default:
        return "#fbbf24";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <RefreshCw size={28} />
        <p>Loading scan history...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>SECURITY WORKSPACE</p>
          <h1 style={styles.heading}>Scan History</h1>
          <p style={styles.subtitle}>
            View and manage all your previous security scans.
          </p>
        </div>

        <button
          style={styles.primaryButton}
          onClick={() => navigate("/scans/new")}
        >
          <Plus size={18} />
          New Scan
        </button>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <History color="#34d399" size={22} />
          <p>Total Scans</p>
          <h2>{scans.length}</h2>
        </div>

        <div style={styles.statCard}>
          <ShieldCheck color="#34d399" size={22} />
          <p>Completed</p>
          <h2>{scans.filter((s) => s.status === "COMPLETED").length}</h2>
        </div>

        <div style={styles.statCard}>
          <AlertTriangle color="#ff647c" size={22} />
          <p>Failed</p>
          <h2>{scans.filter((s) => s.status === "FAILED").length}</h2>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input
              style={styles.searchInput}
              placeholder="Search by project, language or scan ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            style={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="RUNNING">Running</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>

          <button style={styles.refreshButton} onClick={fetchScanHistory}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error ? (
          <div style={styles.empty}>
            <AlertTriangle size={32} color="#ff647c" />
            <p>{error}</p>
            <button style={styles.secondaryButton} onClick={fetchScanHistory}>
              Try again
            </button>
          </div>
        ) : filteredScans.length === 0 ? (
          <div style={styles.empty}>
            <History size={42} color="#64748b" />
            <h3>No scans found</h3>
            <p>
              {scans.length === 0
                ? "Your previous security scans will appear here."
                : "Try changing your search or status filter."}
            </p>
            {scans.length === 0 && (
              <button
                style={styles.primaryButton}
                onClick={() => navigate("/scans/new")}
              >
                <Plus size={17} />
                Create your first scan
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Date</th>
                  <th>Language</th>
                  <th>Score</th>
                  <th>Findings</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredScans.map((scan) => (
                  <tr key={scan.id}>
                    <td>
                      <strong>{scan.projectName}</strong>
                      <p style={styles.small}>
                        {scan.id?.slice(0, 8)}...
                      </p>
                    </td>

                    <td>{formatDate(scan.createdAt || scan.startedAt)}</td>

                    <td>{scan.language || "N/A"}</td>

                    <td>
                      <strong>{scan.securityScore ?? "N/A"}</strong>
                      {scan.securityScore != null ? "/100" : ""}
                    </td>

                    <td>
                      {scan._count?.findings ?? scan.findings?.length ?? 0}
                    </td>

                    <td>
                      <span
                        style={{
                          ...styles.status,
                          color: getStatusColor(scan.status),
                        }}
                      >
                        {scan.status}
                      </span>
                    </td>

                    <td>
                      <button
                        style={styles.viewButton}
                        onClick={() => navigate(`/scans/${scan.id}`)}
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    gap: "20px",
    marginBottom: "30px",
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
  subtitle: {
    color: "#94a3b8",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#151f29",
    border: "1px solid #293845",
    borderRadius: "12px",
    padding: "22px",
  },
  card: {
    background: "#151f29",
    border: "1px solid #293845",
    borderRadius: "13px",
    padding: "24px",
  },
  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "25px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#101820",
    border: "1px solid #354653",
    borderRadius: "8px",
    padding: "0 12px",
    flex: "1 1 260px",
  },
  searchInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e5edf2",
    padding: "12px 0",
    width: "100%",
  },
  select: {
    background: "#101820",
    border: "1px solid #354653",
    color: "#e5edf2",
    borderRadius: "8px",
    padding: "11px",
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#1b2833",
    border: "1px solid #354653",
    color: "#e5edf2",
    borderRadius: "8px",
    padding: "11px 15px",
    cursor: "pointer",
  },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#30c6a5",
    color: "#071b18",
    border: "none",
    borderRadius: "8px",
    padding: "12px 17px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#1b2833",
    color: "#e5edf2",
    border: "1px solid #354653",
    borderRadius: "8px",
    padding: "11px 16px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    minWidth: "850px",
  },
  small: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "5px",
  },
  status: {
    fontSize: "12px",
    fontWeight: 700,
  },
  viewButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    border: "1px solid #354653",
    color: "#34d399",
    borderRadius: "7px",
    padding: "8px 12px",
    cursor: "pointer",
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
};

export default ScanHistory;
