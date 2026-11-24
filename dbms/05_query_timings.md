# Query Performance and Timing Analysis — SecureLens

## 1. Objective

The objective of this checkpoint is to analyze and optimize PostgreSQL query performance in the SecureLens database.

The analysis focuses on actual database operations performed by SecureLens:

- Retrieving projects belonging to a user.
- Retrieving scan history for a project.
- Fetching vulnerability findings for a scan.
- Generating severity-wise vulnerability summaries.
- Generating project-level scan statistics.

PostgreSQL `EXPLAIN (ANALYZE, BUFFERS, VERBOSE)` is used to measure query execution performance and examine query execution plans.

## 2. Database Environment

| Parameter | Details |
|---|---|
| Project | SecureLens |
| Database | PostgreSQL |
| Tables | users, projects, scans, files, findings, vulnerability_types |
| Query analysis | EXPLAIN (ANALYZE, BUFFERS, VERBOSE) |
| Performance metrics | Planning Time, Execution Time, Actual Rows, Buffers |
| Benchmark dataset | 100 users, 5,000 projects, 50,000 scans, 100,000 files, 500,000 findings |

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

For the benchmark, three execution runs are recorded where available. Their arithmetic mean is used as the average execution time.

## 4. Benchmark Queries

### Q1. Retrieve Projects Belonging to a User

```sql
SELECT
    id,
    name,
    description,
    repository_url,
    created_at
FROM projects
WHERE user_id = '4474c61b-e744-4426-856c-d1390411b7b0'
ORDER BY created_at DESC;
```

**Purpose:**
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
WHERE project_id = '01180456-4514-4170-b1dd-ed9affba07ee'
ORDER BY created_at DESC;
```

**Purpose:**
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
WHERE f.scan_id = 'ac29e140-1020-4af4-8bf0-ca6611247383'
ORDER BY f.severity, f.line_start;
```

**Purpose:**
- Retrieves detailed vulnerability information.
- Joins findings with file and vulnerability type information.
- Supports the vulnerability report and scan result pages.

### Q4. Generate Severity-wise Vulnerability Statistics

```sql
SELECT
    severity,
    COUNT(*) AS total_findings
FROM findings
WHERE scan_id = 'ac29e140-1020-4af4-8bf0-ca6611247383'
GROUP BY severity
ORDER BY total_findings DESC;
```

**Purpose:**
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
WHERE p.id = '01180456-4514-4170-b1dd-ed9affba07ee'
GROUP BY p.id, p.name;
```

**Purpose:**
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

**Benefit:**
- Improves user-specific project retrieval.
- Supports sorting projects by creation date.

### Index 2: Scan History by Project

```sql
CREATE INDEX idx_scans_project_created
ON scans(project_id, created_at DESC);
```

**Benefit:**
- Improves project scan-history retrieval.
- Supports filtering scans by project and ordering by creation date.

### Index 3: Findings by Scan and Severity

```sql
CREATE INDEX idx_findings_scan_severity
ON findings(scan_id, severity);
```

**Benefit:**
- Helps retrieve findings belonging to a scan.
- Supports severity-based filtering and grouping.

### Index 4: Findings by Vulnerability Type

```sql
CREATE INDEX idx_findings_vulnerability_type
ON findings(vulnerability_type_id);
```

**Benefit:**
- Helps queries that retrieve findings by vulnerability category.
- Supports joins with vulnerability_types.

### Index 5: Findings by File and Scan

```sql
CREATE INDEX idx_findings_file_scan
ON findings(file_id, scan_id);
```

**Benefit:**
- Supports file-related finding lookups.
- Supports lookups involving the composite file-and-scan relationship.

## 6. Before and After Performance Testing

The benchmark queries are measured using:

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT
    id,
    name,
    description,
    repository_url,
    created_at
FROM projects
WHERE user_id = '4474c61b-e744-4426-856c-d1390411b7b0'
ORDER BY created_at DESC;
```

The same process is followed for Q2, Q3, Q4, and Q5.

### 6.1 Overall Performance Results

| Query | Before (ms) | After (ms) | Improvement |
|---|---:|---:|---:|
| Q1 - User Projects | 1.482 | 0.757 | 48.92% |
| Q2 - Project Scan History | Pending | 0.141 | Pending |
| Q3 - Scan Findings | 31.481 | 0.541 | 98.28% |
| Q4 - Severity Statistics | Pending | Pending | Pending |
| Q5 - Project Statistics | 4.861 | Pending | Pending |

**Measurement note:** Q1's recorded values are the execution times available from its before and after plans. The conversation does not contain three separate Q1 runs, so these values are not represented as three-run averages. The Q2, Q3 and Q5 averages below are calculated from the three supplied runs.

### 6.2 Q1 — User Projects

Recorded execution times:

| Measurement | Execution time |
|---|---:|
| Before | 1.482 ms |
| After | 0.757 ms |

Before optimization:
- PostgreSQL used a Sequential Scan on projects.
- 4,950 rows were removed by the user ID filter.
- The matching 50 rows were sorted by created_at.

After optimization:
- PostgreSQL used `idx_projects_user_created`.
- A Bitmap Index Scan and Bitmap Heap Scan were used.
- PostgreSQL still performed a separate Sort operation.

Recorded execution time decreased by approximately 48.92%.

### 6.3 Q2 — Project Scan History

After-index execution runs:

| Run | Execution time |
|---|---:|
| 1 | 0.153 ms |
| 2 | 0.167 ms |
| 3 | 0.102 ms |
| **Average** | **0.141 ms** |

After optimization:
- PostgreSQL used `idx_scans_project_created`.
- The plan used a Bitmap Index Scan followed by a Bitmap Heap Scan.
- A separate Sort operation was still performed on `created_at DESC`.
- Ten scan records were returned.

The before-index execution runs have not yet been supplied, so the improvement percentage cannot be calculated.

### 6.4 Q3 — Scan Findings

Before-index execution runs:

| Run | Execution time |
|---|---:|
| 1 | 40.769 ms |
| 2 | 27.863 ms |
| 3 | 25.812 ms |
| **Average** | **31.481 ms** |

After-index execution runs:

| Run | Execution time |
|---|---:|
| 1 | 1.111 ms |
| 2 | 0.314 ms |
| 3 | 0.197 ms |
| **Average** | **0.541 ms** |

Before optimization:
- PostgreSQL used a Parallel Sequential Scan on findings.
- The execution plan included a Gather operation and joins with files and vulnerability_types.

After optimization:
- PostgreSQL used `idx_findings_scan_id`.
- A Bitmap Index Scan and Bitmap Heap Scan replaced the expensive parallel sequential scan.
- Ten matching findings were returned.

Average execution time improved by approximately 98.28%.

**Note:** The index used in this experiment was `idx_findings_scan_id`, a single-column index created specifically for the scan ID filter. It was not the proposed composite index `idx_findings_scan_severity`.

### 6.5 Q4 — Severity Statistics

The severity-wise statistics query groups findings by severity for a particular scan.

Before and after execution measurements have not yet been supplied.

The proposed index is:

```sql
CREATE INDEX idx_findings_scan_severity
ON findings(scan_id, severity);
```

The actual before-and-after plans and execution times will be added after measurement.

### 6.6 Q5 — Project Statistics

Before-index execution runs:

| Run | Execution time |
|---|---:|
| 1 | 6.126 ms |
| 2 | 4.438 ms |
| 3 | 4.020 ms |
| **Average** | **4.861 ms** |

Before optimization:
- PostgreSQL used an Index Scan on `projects_pkey`.
- PostgreSQL used a Sequential Scan on scans.
- 49,990 scan rows were removed by the project ID filter.
- Findings were retrieved using a Bitmap Index Scan on `idx_findings_scan_id`.
- The joined rows were sorted and processed using GroupAggregate.

The after-index execution runs have not yet been supplied.

**Benchmark note:** The supplied Q5 before plans still use `idx_findings_scan_id`. Therefore, this measurement is not a completely index-free baseline. The actual plan output is retained without modification.

## 7. Performance Improvement Calculation

The percentage improvement is calculated using:

\[
\text{Improvement (\%)} =
\frac{\text{Before Time} - \text{After Time}}
{\text{Before Time}} \times 100
\]

A positive value indicates reduced execution time.

A negative value indicates that the query became slower.

For Q1:

\[
\frac{1.482-0.757}{1.482}\times100
\approx 48.92\%
\]

For Q3:

\[
\frac{31.481-0.541}{31.481}\times100
\approx 98.28\%
\]

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

The following files are maintained:

```text
query_01_before.txt
query_01_after.txt
query_02_before.txt
query_02_after.txt
query_03_before.txt
query_03_after.txt
query_04_before.txt
query_04_after.txt
query_05_before.txt
query_05_after.txt
README.md
```

The following factors are considered:

- Sequential Scan and Index Scan.
- Estimated rows versus actual rows.
- Planning Time and Execution Time.
- Shared buffer hits and reads.
- Index utilization.
- Sorting and aggregation operations.

## 9. Conclusion

The SecureLens database supports multiple related operations involving users, projects, scans, files, and vulnerability findings.

Query performance analysis helps identify expensive database operations and opportunities for optimization.

The completed measurements show improvements in Q1 and Q3 after index-based optimization. Q2 has an after-index execution measurement, and Q5 has a before-index measurement. Q4 and the remaining comparisons still require benchmark runs.

Indexes are proposed for frequently filtered and joined columns. Their effectiveness is evaluated using PostgreSQL execution plans and actual query execution times.

The final optimization decisions are based on measured results rather than assumed performance improvements.