
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  GitBranch,
  RefreshCw,
  X,
} from "lucide-react";

import projectService from "../../services/projectService";

export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    repository: "",
  });

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const data = await projectService.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load your projects."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Project name is required.");
      return;
    }

    try {
      setSubmitting(true);

      const created = await projectService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        repository: form.repository.trim(),
      });

      setProjects((current) => [created, ...current]);

      setForm({
        name: "",
        description: "",
        repository: "",
      });

      setModalOpen(false);
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Could not create project."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(event, id) {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Delete this project and its associated scans?"
    );

    if (!confirmed) return;

    try {
      await projectService.delete(id);

      setProjects((current) =>
        current.filter((project) => project.id !== id)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete project."
      );
    }
  }

  const filteredProjects = projects.filter((project) => {
    const query = search.toLowerCase();

    return (
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.repository?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="projects-page">
      <section className="projects-heading">
        <div>
          <span className="eyebrow">WORKSPACE</span>
          <h1>Projects</h1>
          <p>Manage your codebases and security assessments.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={17} />
          New project
        </button>
      </section>

      <section className="projects-toolbar">
        <div className="projects-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
          />
        </div>

        <button
          className="secondary-button"
          onClick={loadProjects}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>

      {error && <div className="project-error">{error}</div>}

      {loading ? (
        <div className="projects-state">
          <RefreshCw className="spin" size={25} />
          <p>Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="projects-empty">
          <div className="projects-empty-icon">
            <FolderKanban size={30} />
          </div>

          <h2>
            {search ? "No matching projects" : "No projects yet"}
          </h2>

          <p>
            {search
              ? "Try a different search term."
              : "Create your first project to start analyzing your source code."}
          </p>

          {!search && (
            <button
              className="primary-button"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={17} />
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <section className="projects-grid">
          {filteredProjects.map((project) => (
            <article
              className="project-card"
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="project-card-top">
                <div className="project-icon">
                  <FolderKanban size={21} />
                </div>

                <button
                  className="project-delete"
                  title="Delete project"
                  onClick={(event) => handleDelete(event, project.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3>{project.name}</h3>

              <p className="project-description">
                {project.description || "No description provided."}
              </p>

              {project.repository && (
                <a
                  className="project-repository"
                  href={project.repository}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  <GitBranch size={14} />
                  Repository
                  <ExternalLink size={13} />
                </a>
              )}

              <div className="project-card-footer">
                <span>
                  Created{" "}
                  {project.createdAt
                    ? new Date(project.createdAt).toLocaleDateString()
                    : "Recently"}
                </span>

                <span>View project →</span>
              </div>
            </article>
          ))}
        </section>
      )}

      {modalOpen && (
        <div
          className="project-modal-backdrop"
          onClick={() => !submitting && setModalOpen(false)}
        >
          <section
            className="project-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="project-modal-heading">
              <div>
                <span className="eyebrow">NEW WORKSPACE</span>
                <h2>Create project</h2>
              </div>

              <button
                className="icon-button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <label>
                Project name *
                <input
                  required
                  maxLength={100}
                  placeholder="e.g. SecureLens Backend"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>

              <label>
                Description
                <textarea
                  rows={3}
                  placeholder="What does this project do?"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>

              <label>
                Repository URL
                <input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={form.repository}
                  onChange={(event) =>
                    setForm({ ...form, repository: event.target.value })
                  }
                />
              </label>

              {formError && (
                <div className="project-error">{formError}</div>
              )}

              <div className="project-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create project"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
