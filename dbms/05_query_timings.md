
# Query Performance and Timing Analysis — SecureLens

## 1. Objective

The objective of this checkpoint is to analyze and optimize PostgreSQL query performance in the SecureLens database.

The analysis focuses on actual database operations performed by SecureLens:

- Retrieving projects belonging to a user.
- Retrieving scan history for a project.
- Fetching vulnerability findings for a scan.
- Generating severity-wise vulnerability summaries.
- Generating project-level scan statistics.

PostgreSQL EXPLAIN ANALYZE is used to measure query execution performance and examine query execution plans.

## 2. Database Environment

| Parameter | Details |
|---|---|
| Project | SecureLens |
| Database | PostgreSQL |
| Tables | users, projects, scans, files, findings, vulnerability_types |
| Query analysis | EXPLAIN ANALYZE |
| Performance metrics | Planning Time, Execution Time, Rows, Buffers |

## 3. Query Performance Measurement

PostgreSQL provides the following command:

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM projects;
```

The following metrics are evaluated:

| Metric | Description |
|---|---|
| Planning Time | Time required to generate the query execution plan |
| Execution Time | Actual query execution time |
| Sequential Scan | Reads rows by scanning a table |
| Index Scan | Uses an index to retrieve matching records |
| Actual Rows | Actual number of rows returned or processed |
| Shared Hit Blocks | Data pages found in PostgreSQL shared buffers |
| Shared Read Blocks | Data pages read into shared buffers |

## 4. Benchmark Queries

### Q1. Retrieve Projects Belonging to a User

This query retrieves all projects created by a particular user.

```sql
SELECT
    id,
    name,
    description,
    repository_url,
    created_at
FROM projects
WHERE user_id = 'REPLACE_WITH_USER_UUID'
ORDER BY created_at DESC;
```

Purpose:
- Retrieves projects for the authenticated user.
- Supports the SecureLens Projects page.

### Q2. Retrieve Scan History for a Project

```sql
SELECT
    id,
    project_id,
    status,
    language,
    security_score,
    started_at,
    completed_at,
    created_at
FROM scans
WHERE project_id = 'REPLACE_WITH_PROJECT_UUID'
ORDER BY created_at DESC;
```

Purpose:
- Retrieves scan history for a selected project.
- Supports the Scan History page.

### Q3. Retrieve Vulnerability Findings for a Scan

```sql
SELECT
    f.id,
    f.severity,
    f.confidence,
    f.line_start,
    f.line_end,
    f.message,
    f.evidence,
    fi.path AS file_path,
    vt.name AS vulnerability_name,
    vt.cwe_id
FROM findings f
JOIN files fi
    ON f.file_id = fi.id
   AND f.scan_id = fi.scan_id
JOIN vulnerability_types vt
    ON f.vulnerability_type_id = vt.id
WHERE f.scan_id = 'REPLACE_WITH_SCAN_UUID'
ORDER BY f.severity, f.line_start;
```

Purpose:
- Retrieves detailed vulnerability information.
- Joins findings with file and vulnerability type information.
- Supports the vulnerability report and scan result pages.

### Q4. Generate Severity-wise Vulnerability Statistics

```sql
SELECT
    severity,
    COUNT(*) AS total_findings
FROM findings
WHERE scan_id = 'REPLACE_WITH_SCAN_UUID'
GROUP BY severity
ORDER BY total_findings DESC;
```

Purpose:
- Counts vulnerabilities by severity.
- Supports security dashboards and vulnerability summaries.

### Q5. Generate Project-level Scan Statistics

```sql
SELECT
    p.id,
    p.name,
    COUNT(DISTINCT s.id) AS total_scans,
    COUNT(DISTINCT f.id) AS total_findings,
    COUNT(DISTINCT s.id) FILTER (
        WHERE s.status = 'COMPLETED'
    ) AS completed_scans
FROM projects p
LEFT JOIN scans s
    ON s.project_id = p.id
LEFT JOIN findings f
    ON f.scan_id = s.id
WHERE p.id = 'REPLACE_WITH_PROJECT_UUID'
GROUP BY p.id, p.name;
```

Purpose:
- Generates project-level scan statistics.
- Shows total scans, findings, and completed scans.
- Supports the SecureLens dashboard.

## 5. Index Optimization

The following indexes are proposed to improve frequently executed queries.

### Index 1: Projects by User

```sql
CREATE INDEX idx_projects_user_created
ON projects(user_id, created_at DESC);
```

Benefit:
- Improves user-specific project retrieval.
- Supports sorting projects by creation date.

### Index 2: Scan History by Project

```sql
CREATE INDEX idx_scans_project_created
ON scans(project_id, created_at DESC);
```

Benefit:
- Improves project scan-history retrieval.
- Supports ordering scans by creation date.

### Index 3: Findings by Scan and Severity

```sql
CREATE INDEX idx_findings_scan_severity
ON findings(scan_id, severity);
```

Benefit:
- Helps retrieve findings belonging to a scan.
- Supports severity-based filtering and grouping.

### Index 4: Findings by Vulnerability Type

```sql
CREATE INDEX idx_findings_vulnerability_type
ON findings(vulnerability_type_id);
```

Benefit:
- Helps queries that retrieve findings by vulnerability category.
- Supports joins with vulnerability_types.

### Index 5: Findings by File and Scan

```sql
CREATE INDEX idx_findings_file_scan
ON findings(file_id, scan_id);
```

Benefit:
- Supports file-related finding lookups.
- Helps with the composite foreign-key relationship between findings and files.

## 6. Before and After Performance Testing

Before optimization, execute the benchmark queries using:

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT
    id, name, description, repository_url, created_at
FROM projects
WHERE user_id = 'REPLACE_WITH_USER_UUID'
ORDER BY created_at DESC;
```

Repeat the process for Q2, Q3, Q4, and Q5.

After creating the proposed indexes, execute the same queries again.

Record the actual execution times in the following table:

| Query | Before (ms) | After (ms) |
|---|---:|---:|
| Q1 - User Projects | To be measured | To be measured |
| Q2 - Project Scan History | To be measured | To be measured |
| Q3 - Scan Findings | To be measured | To be measured |
| Q4 - Severity Statistics | To be measured | To be measured |
| Q5 - Project Statistics | To be measured | To be measured |

## 7. Performance Improvement Calculation

The percentage improvement is calculated using:

Improvement (%) = ((Before Time - After Time) / Before Time) × 100

A positive value indicates reduced execution time.

A negative value indicates that the query became slower.

## 8. Execution Plan Analysis

Execution plans are generated using:

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM scans;
```

The execution plans are stored in:

```text
dbms/plans/
```

The following factors are considered:

- Sequential Scan and Index Scan.
- Estimated rows versus actual rows.
- Planning Time and Execution Time.
- Shared buffer hits and reads.
- Index utilization.

## 9. Conclusion

The SecureLens database supports multiple related operations involving users, projects, scans, files, and vulnerability findings.

Query performance analysis helps identify expensive database operations and opportunities for optimization.

Indexes are proposed for frequently filtered and joined columns. Their effectiveness is evaluated using PostgreSQL execution plans and actual query execution times.

The final optimization decisions are based on measured results rather than assumed performance improvements.
