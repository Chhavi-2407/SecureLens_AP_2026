-- ============================================================
-- SecureLens - Application SQL Queries
-- File: dbms/04_queries.sql
-- Database: PostgreSQL
--
-- Parameter convention:
--   $1, $2, ... are positional parameters supplied by the backend.
--   Never concatenate user input into SQL strings.
--
-- READ  = SELECT query (does not modify application data)
-- WRITE = INSERT, UPDATE, or DELETE query
--
-- These queries use the table/column names from dbms/03_schema.sql.
-- ============================================================


-- ============================================================
-- 1. AUTHENTICATION
-- ============================================================

-- WRITE: Register a new user.
-- The backend must hash the password with bcrypt before executing this query.
INSERT INTO users (name, email, password_hash)
VALUES ($1, LOWER($2), $3)
RETURNING id, name, email, created_at;

-- READ: Find a user during login.
-- password_hash is returned only so the backend can verify it with bcrypt.
-- Do not return password_hash in an API response.
SELECT
    id,
    name,
    email,
    password_hash,
    created_at
FROM users
WHERE email = LOWER($1);

-- READ: Get the authenticated user's profile.
SELECT
    id,
    name,
    email,
    created_at,
    updated_at
FROM users
WHERE id = $1;


-- ============================================================
-- 2. PROJECT MANAGEMENT
-- ============================================================

-- WRITE: Create a project for the authenticated user.
INSERT INTO projects (user_id, name, description, repository_url)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, name, description, repository_url, created_at;

-- READ: List a user's projects with scan and finding totals.
-- LEFT JOIN keeps projects visible even if they have no scans yet.
WITH project_scan_totals AS (
    SELECT
        s.project_id,
        COUNT(DISTINCT s.id) AS total_scans,
        COUNT(DISTINCT f.id) AS total_findings
    FROM scans AS s
    LEFT JOIN findings AS f ON f.scan_id = s.id
    GROUP BY s.project_id
)
SELECT
    p.id AS project_id,
    p.name,
    p.description,
    p.repository_url,
    p.created_at,
    COALESCE(pst.total_scans, 0) AS total_scans,
    COALESCE(pst.total_findings, 0) AS total_findings
FROM projects AS p
LEFT JOIN project_scan_totals AS pst ON pst.project_id = p.id
WHERE p.user_id = $1
ORDER BY p.created_at DESC;

-- READ: Get one project, verifying that it belongs to the logged-in user.
SELECT
    p.id AS project_id,
    p.name,
    p.description,
    p.repository_url,
    p.created_at,
    u.id AS owner_id,
    u.name AS owner_name,
    u.email AS owner_email
FROM projects AS p
INNER JOIN users AS u ON u.id = p.user_id
WHERE p.id = $1
  AND p.user_id = $2;

-- WRITE: Update project details.
UPDATE projects
SET
    name = $3,
    description = $4,
    repository_url = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND user_id = $2
RETURNING id, name, description, repository_url, updated_at;

-- WRITE: Delete a project owned by the authenticated user.
-- Related scans and dependent records are removed by ON DELETE CASCADE.
DELETE FROM projects
WHERE id = $1
  AND user_id = $2
RETURNING id;


-- ============================================================
-- 3. SCAN MANAGEMENT
-- ============================================================

-- WRITE: Create a scan only if the project belongs to the current user.
-- The scan starts in PENDING state.
INSERT INTO scans (project_id, started_by, status, language)
SELECT
    p.id,
    $2,
    'PENDING',
    $3
FROM projects AS p
WHERE p.id = $1
  AND p.user_id = $2
RETURNING id, project_id, started_by, status, language, created_at;

-- READ: List scans for a project, including summary metrics.
SELECT
    s.id AS scan_id,
    s.project_id,
    p.name AS project_name,
    s.status,
    s.language,
    s.security_score,
    s.started_at,
    s.completed_at,
    s.created_at,
    COALESCE(sm.total_findings, 0) AS total_findings,
    COALESCE(sm.critical_count, 0) AS critical_count,
    COALESCE(sm.high_count, 0) AS high_count,
    COALESCE(sm.medium_count, 0) AS medium_count,
    COALESCE(sm.low_count, 0) AS low_count
FROM scans AS s
INNER JOIN projects AS p ON p.id = s.project_id
LEFT JOIN scan_metrics AS sm ON sm.scan_id = s.id
WHERE s.project_id = $1
  AND p.user_id = $2
ORDER BY s.created_at DESC;

-- READ: Get one scan with its project, initiating user, and metrics.
SELECT
    s.id AS scan_id,
    s.status,
    s.language,
    s.security_score,
    s.started_at,
    s.completed_at,
    s.created_at,
    p.id AS project_id,
    p.name AS project_name,
    u.id AS started_by_id,
    u.name AS started_by_name,
    sm.total_findings,
    sm.critical_count,
    sm.high_count,
    sm.medium_count,
    sm.low_count,
    sm.info_count,
    sm.duration_ms
FROM scans AS s
INNER JOIN projects AS p ON p.id = s.project_id
INNER JOIN users AS u ON u.id = s.started_by
LEFT JOIN scan_metrics AS sm ON sm.scan_id = s.id
WHERE s.id = $1
  AND p.user_id = $2;

-- WRITE: Mark a scan as running.
UPDATE scans
SET
    status = 'RUNNING',
    started_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND EXISTS (
      SELECT 1
      FROM projects AS p
      WHERE p.id = scans.project_id
        AND p.user_id = $2
  )
RETURNING id, status, started_at;

-- WRITE: Mark a scan as completed and store its security score.
UPDATE scans
SET
    status = 'COMPLETED',
    security_score = $3,
    completed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND EXISTS (
      SELECT 1
      FROM projects AS p
      WHERE p.id = scans.project_id
        AND p.user_id = $2
  )
RETURNING id, status, security_score, completed_at;

-- WRITE: Mark a scan as failed.
UPDATE scans
SET
    status = 'FAILED',
    completed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, status, completed_at;


-- ============================================================
-- 4. FILES ANALYZED BY A SCAN
-- ============================================================

-- WRITE: Insert a file discovered by the scanner.
-- If the same path is encountered again in the same scan, update its metadata.
INSERT INTO files (scan_id, path, language, size_bytes)
VALUES ($1, $2, $3, $4)
ON CONFLICT (scan_id, path)
DO UPDATE SET
    language = EXCLUDED.language,
    size_bytes = EXCLUDED.size_bytes
RETURNING id, scan_id, path, language, size_bytes;

-- READ: List files belonging to a scan.
SELECT
    f.id AS file_id,
    f.path,
    f.language,
    f.size_bytes,
    COUNT(fi.id) AS finding_count
FROM files AS f
LEFT JOIN findings AS fi
    ON fi.file_id = f.id
   AND fi.scan_id = f.scan_id
WHERE f.scan_id = $1
GROUP BY f.id, f.path, f.language, f.size_bytes
ORDER BY f.path;


-- ============================================================
-- 5. VULNERABILITY FINDINGS
-- ============================================================

-- WRITE: Insert a finding produced by the security scanner.
-- The composite foreign key ensures that file_id belongs to scan_id.
INSERT INTO findings (
    scan_id,
    file_id,
    vulnerability_type_id,
    severity,
    confidence,
    line_start,
    line_end,
    message,
    evidence,
    source_expression,
    sink_expression
)
SELECT
    $1, f.id, $3, $4, $5, $6, $7, $8, $9, $10, $11
FROM files AS f
WHERE f.id = $2
  AND f.scan_id = $1
RETURNING id, scan_id, file_id, vulnerability_type_id, severity, confidence;

-- READ: Get findings for a scan with file and vulnerability information.
SELECT
    fi.id AS finding_id,
    fi.severity,
    fi.confidence,
    fi.line_start,
    fi.line_end,
    fi.message,
    fi.evidence,
    fi.source_expression,
    fi.sink_expression,
    f.path AS file_path,
    vt.name AS vulnerability_name,
    vt.cwe_id,
    vt.description AS vulnerability_description
FROM findings AS fi
INNER JOIN files AS f
    ON f.id = fi.file_id
   AND f.scan_id = fi.scan_id
INNER JOIN vulnerability_types AS vt
    ON vt.id = fi.vulnerability_type_id
WHERE fi.scan_id = $1
ORDER BY
    CASE fi.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
    END,
    fi.line_start;

-- READ: Get one finding with its scan, project, file, and vulnerability type.
SELECT
    fi.id AS finding_id,
    fi.severity,
    fi.confidence,
    fi.line_start,
    fi.line_end,
    fi.message,
    fi.evidence,
    fi.source_expression,
    fi.sink_expression,
    f.path AS file_path,
    s.id AS scan_id,
    p.id AS project_id,
    p.name AS project_name,
    vt.name AS vulnerability_name,
    vt.cwe_id
FROM findings AS fi
INNER JOIN files AS f
    ON f.id = fi.file_id
   AND f.scan_id = fi.scan_id
INNER JOIN scans AS s ON s.id = fi.scan_id
INNER JOIN projects AS p ON p.id = s.project_id
INNER JOIN vulnerability_types AS vt
    ON vt.id = fi.vulnerability_type_id
WHERE fi.id = $1
  AND p.user_id = $2;

-- READ: List vulnerability types supported by the scanner.
SELECT
    id,
    name,
    cwe_id,
    description,
    default_severity
FROM vulnerability_types
ORDER BY name;


-- ============================================================
-- 6. REMEDIATION RECOMMENDATIONS
-- ============================================================

-- WRITE: Save a remediation recommendation for a finding.
INSERT INTO recommendations (finding_id, description, suggested_fix)
SELECT
    fi.id,
    $2,
    $3
FROM findings AS fi
INNER JOIN scans AS s ON s.id = fi.scan_id
INNER JOIN projects AS p ON p.id = s.project_id
WHERE fi.id = $1
  AND p.user_id = $4
RETURNING id, finding_id, description, suggested_fix;

-- READ: Get a finding and all its remediation recommendations.
SELECT
    fi.id AS finding_id,
    fi.message AS finding_message,
    r.id AS recommendation_id,
    r.description AS recommendation_description,
    r.suggested_fix
FROM findings AS fi
LEFT JOIN recommendations AS r ON r.finding_id = fi.id
WHERE fi.id = $1
ORDER BY r.created_at;


-- ============================================================
-- 7. SCAN METRICS AND DASHBOARD
-- ============================================================

-- WRITE: Insert or refresh the one-to-one metrics summary for a scan.
INSERT INTO scan_metrics (
    scan_id,
    total_findings,
    critical_count,
    high_count,
    medium_count,
    low_count,
    info_count,
    duration_ms,
    security_score
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (scan_id)
DO UPDATE SET
    total_findings = EXCLUDED.total_findings,
    critical_count = EXCLUDED.critical_count,
    high_count = EXCLUDED.high_count,
    medium_count = EXCLUDED.medium_count,
    low_count = EXCLUDED.low_count,
    info_count = EXCLUDED.info_count,
    duration_ms = EXCLUDED.duration_ms,
    security_score = EXCLUDED.security_score
RETURNING *;

-- READ: Get dashboard totals for one user's projects.
SELECT
    COUNT(DISTINCT p.id) AS total_projects,
    COUNT(DISTINCT s.id) AS total_scans,
    COUNT(DISTINCT fi.id) AS total_findings,
    COUNT(DISTINCT fi.id) FILTER (WHERE fi.severity = 'CRITICAL') AS critical_findings,
    COUNT(DISTINCT fi.id) FILTER (WHERE fi.severity = 'HIGH') AS high_findings,
    COUNT(DISTINCT fi.id) FILTER (WHERE fi.severity = 'MEDIUM') AS medium_findings,
    COUNT(DISTINCT fi.id) FILTER (WHERE fi.severity = 'LOW') AS low_findings
FROM projects AS p
LEFT JOIN scans AS s ON s.project_id = p.id
LEFT JOIN findings AS fi ON fi.scan_id = s.id
WHERE p.user_id = $1;


-- ============================================================
-- 8. DEPENDENCY SCANNING
-- ============================================================

-- WRITE: Add a dependency discovered in a project manifest.
INSERT INTO dependencies (project_id, package_name, version, ecosystem)
VALUES ($1, $2, $3, $4)
ON CONFLICT (project_id, package_name, version, ecosystem)
DO UPDATE SET package_name = EXCLUDED.package_name
RETURNING id, project_id, package_name, version, ecosystem;

-- WRITE: Store a known security advisory affecting a dependency.
INSERT INTO dependency_vulnerabilities (
    dependency_id,
    advisory_id,
    affected_range,
    fixed_version,
    severity,
    description
)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (dependency_id, advisory_id)
DO UPDATE SET
    affected_range = EXCLUDED.affected_range,
    fixed_version = EXCLUDED.fixed_version,
    severity = EXCLUDED.severity,
    description = EXCLUDED.description
RETURNING id, dependency_id, advisory_id, severity;

-- READ: List dependencies and their known vulnerabilities for a project.
SELECT
    d.id AS dependency_id,
    d.package_name,
    d.version,
    d.ecosystem,
    dv.advisory_id,
    dv.affected_range,
    dv.fixed_version,
    dv.severity,
    dv.description AS advisory_description
FROM dependencies AS d
LEFT JOIN dependency_vulnerabilities AS dv
    ON dv.dependency_id = d.id
WHERE d.project_id = $1
ORDER BY d.package_name, dv.severity;


-- ============================================================
-- END OF SECURELENS APPLICATION QUERIES
-- ============================================================
