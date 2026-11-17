CREATE TYPE scan_status AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    repository_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    started_by UUID NOT NULL,
    status scan_status NOT NULL DEFAULT 'PENDING',
    language VARCHAR(40),
    security_score NUMERIC(5,2),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scans_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_scans_started_by
        FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_scans_security_score
        CHECK (security_score IS NULL OR security_score BETWEEN 0 AND 100)
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL,
    path TEXT NOT NULL,
    language VARCHAR(40),
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_files_scan
        FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
    CONSTRAINT uq_files_scan_path UNIQUE (scan_id, path),
    CONSTRAINT uq_files_id_scan UNIQUE (id, scan_id),
    CONSTRAINT chk_files_size CHECK (size_bytes IS NULL OR size_bytes >= 0)
);

CREATE TABLE vulnerability_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL UNIQUE,
    cwe_id VARCHAR(20),
    description TEXT,
    default_severity VARCHAR(10) NOT NULL,
    CONSTRAINT chk_vulnerability_default_severity
        CHECK (default_severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'))
);

CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL,
    file_id UUID NOT NULL,
    vulnerability_type_id UUID NOT NULL,
    severity VARCHAR(10) NOT NULL,
    confidence NUMERIC(4,3) NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    message TEXT NOT NULL,
    evidence TEXT,
    source_expression TEXT,
    sink_expression TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_findings_scan
        FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
    -- Composite FK guarantees that the referenced file belongs to this scan.
    CONSTRAINT fk_findings_file_scan
        FOREIGN KEY (file_id, scan_id) REFERENCES files(id, scan_id) ON DELETE CASCADE,