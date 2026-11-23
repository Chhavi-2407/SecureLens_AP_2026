
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FolderKanban,
  ScanSearch,
  GitBranch,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

import projectService from "../../services/projectService";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        setError("");

        const data = await projectService.getById(id);
        setProject(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load project."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id]);

  if (loading) {
    return (
      <div className="projects-state">
        <RefreshCw className="spin" size={25} />
        <p>Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="projects-empty">
        <h2>Project unavailable</h2>
        <p>{error || "This project could not be found."}</p>

        <button
          className="secondary-button"
          onClick={() => navigate("/projects")}
        >
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="project-details-page">
      <button
        className="back-button"
        onClick={() => navigate("/projects")}
      >
        <ArrowLeft size={16} />
        Back to projects
      </button>

      <section className="project-details-heading">
        <div className="project-icon large">
          <FolderKanban size={27} />
        </div>

        <div>
          <span className="eyebrow">PROJECT WORKSPACE</span>
          <h1>{project.name}</h1>
          <p>{project.description || "No project description."}</p>
        </div>
      </section>

      <section className="project-details-grid">
        <article className="panel project-info-panel">
          <h2>Project information</h2>

          <div className="project-info-row">
            <FolderKanban size={17} />
            <div>
              <span>Project name</span>
              <strong>{project.name}</strong>
            </div>
          </div>

          <div className="project-info-row">
            <CalendarDays size={17} />
            <div>
              <span>Created</span>
              <strong>
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleString()
                  : "Not available"}
              </strong>
            </div>
          </div>

          <div className="project-info-row">
            <GitBranch size={17} />
            <div>
              <span>Repository</span>

              {project.repository ? (
                <a
                  href={project.repository}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open repository
                </a>
              ) : (
                <strong>Not connected</strong>
              )}
            </div>
          </div>
        </article>

        <article className="panel project-scan-panel">
          <div className="project-icon">
            <ScanSearch size={22} />
          </div>

          <h2>Security assessment</h2>

          <p>
            Run a static security analysis on code associated with this
            project.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/scans/new", {
                state: { projectId: project.id },
              })
            }
          >
            <ScanSearch size={17} />
            Start security scan
          </button>
        </article>
      </section>
    </div>
  );
}
