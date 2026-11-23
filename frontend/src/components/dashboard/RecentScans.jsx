
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Eye } from "lucide-react";

export default function RecentScans({ scans }) {
  const navigate = useNavigate();

  return (
    <section className="panel recent-panel">
      <div className="panel-heading">
        <div>
          <h2>Recent scans</h2>
          <p>Your latest security analysis activity</p>
        </div>

        <button
          className="text-button"
          onClick={() => navigate("/scans/history")}
        >
          View all <ArrowUpRight size={15} />
        </button>
      </div>

      <div className="table-wrap">
        <table className="scans-table">
          <thead>
            <tr>
              <th>PROJECT</th>
              <th>LANGUAGE</th>
              <th>LAST SCAN</th>
              <th>FINDINGS</th>
              <th>SEVERITY</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>

          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id}>
                <td>
                  <div className="project-cell">
                    <div className="project-mini-icon">
                      {scan.project.slice(0, 1).toUpperCase()}
                    </div>

                    <div>
                      <strong>{scan.project}</strong>
                      <span>{scan.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </td>

                <td>
                  <span className="language-label">{scan.language}</span>
                </td>

                <td className="date-cell">{scan.date}</td>

                <td>
                  <strong className="finding-count">{scan.findings}</strong>
                </td>

                <td>
                  <span
                    className={`severity-pill ${
                      scan.severity.toLowerCase()
                    }`}
                  >
                    <i />
                    {scan.severity}
                  </span>
                </td>

                <td>
                  <button
                    className="icon-button row-action"
                    aria-label={`View scan for ${scan.project}`}
                    onClick={() => navigate(`/scans/${scan.id}`)}
                  >
                    <Eye size={17} />
                  </button>
                </td>
              </tr>
            ))}

            {scans.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                  No scans available yet. Run your first security scan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
