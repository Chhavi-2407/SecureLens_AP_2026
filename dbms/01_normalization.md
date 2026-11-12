# Database Normalization – SecureLens

## 1. Introduction

SecureLens is a multi-language code vulnerability and security analysis platform. It allows users to create projects, scan source code, identify security vulnerabilities, and view detailed security reports.

The database is designed using normalization principles to reduce data redundancy, prevent insertion, deletion, and update anomalies, and maintain data consistency.

The main entities in the database are:

- User
- Project
- Scan
- File
- Finding
- VulnerabilityType

## 2. Unnormalized Form (UNF)

Initially, all project and scan information could be stored in a single table.

Example:

| User | Project | Scan ID | Files | Vulnerabilities |
|---|---|---|---|---|
| Aditya | SecureLens | S101 | app.js, server.js | SQL Injection, XSS |

### Problems

- Multiple values are stored in individual columns.
- The same user and project information may be repeated.
- Updating project information requires changing multiple records.
- Searching for individual vulnerabilities becomes difficult.

Therefore, this structure is not suitable for a relational database.

## 3. First Normal Form (1NF)

A table satisfies 1NF when:

- Every column contains atomic (single) values.
- Each record is unique.
- There are no repeating groups or multivalued attributes.

To achieve 1NF, we separate projects, scans, files, and findings into individual records.

### Tables

**User**

| user_id (PK) | name | email | password_hash |
|---|---|---|---|
| U01 | Aditya | aditya@example.com | hashed_value |

**Project**

| project_id (PK) | user_id (FK) | name | description |
|---|---|---|---|
| P01 | U01 | SecureLens | Security analysis platform |

**Scan**

| scan_id (PK) | project_id (FK) | status | language |
|---|---|---|---|
| S01 | P01 | COMPLETED | JavaScript |

**File**

| file_id (PK) | scan_id (FK) | path | language |
|---|---|---|---|
| F01 | S01 | src/app.js | JavaScript |

**Finding**

| finding_id (PK) | scan_id (FK) | file_id (FK) | type | severity |
|---|---|---|---|---|
| V01 | S01 | F01 | SQL Injection | HIGH |
| V02 | S01 | F01 | XSS | MEDIUM |

All attributes contain individual values, and each record has a primary key.

Therefore, the database satisfies 1NF.

## 4. Second Normal Form (2NF)

A table satisfies 2NF when:

- It is already in 1NF.
- Every non-key attribute depends on the entire candidate key.
- There are no partial dependencies.

Consider a hypothetical combined table:

**ProjectScan**

| project_id | scan_id | project_name | scan_status |
|---|---|---|---|
| P01 | S01 | SecureLens | COMPLETED |
| P01 | S02 | SecureLens | PENDING |

The composite key is (project_id, scan_id).

Here:
- project_name depends only on project_id.
- scan_status depends on scan_id.

These are partial dependencies because the attributes depend on only part of the composite key.

### Decomposition

We separate the table into:

**Project**

| project_id (PK) | project_name |
|---|---|
| P01 | SecureLens |

**Scan**

| scan_id (PK) | project_id (FK) | scan_status |
|---|---|---|
| S01 | P01 | COMPLETED |
| S02 | P01 | PENDING |

Now, every non-key attribute depends on the complete key of its respective table.

Therefore, the database satisfies 2NF.

## 5. Third Normal Form (3NF)

A table satisfies 3NF when:

- It is already in 2NF.
- It has no transitive dependencies.
- Non-key attributes depend directly on the candidate key.

Consider a hypothetical Finding table:

| finding_id | vulnerability_type | CWE | description |
|---|---|---|---|
| V01 | SQL Injection | CWE-89 | SQL injection vulnerability |
| V02 | XSS | CWE-79 | Cross-site scripting vulnerability |

Here, vulnerability_type determines CWE and description.

The dependency is:

finding_id → vulnerability_type → CWE, description

This creates a transitive dependency.

### Decomposition

We separate vulnerability information into another table.

**VulnerabilityType**

| vulnerability_type_id (PK) | name | CWE | description |
|---|---|---|---|
| VT01 | SQL Injection | CWE-89 | SQL injection vulnerability |
| VT02 | XSS | CWE-79 | Cross-site scripting vulnerability |

**Finding**

| finding_id (PK) | scan_id (FK) | file_id (FK) | vulnerability_type_id (FK) | severity |
|---|---|---|---|---|
| V01 | S01 | F01 | VT01 | HIGH |
| V02 | S01 | F01 | VT02 | MEDIUM |

Now, vulnerability information is maintained separately and referenced through a foreign key.

This avoids unnecessary duplication and update anomalies.

Therefore, the database satisfies 3NF.

## 6. Boyce-Codd Normal Form (BCNF)

BCNF is a stricter version of 3NF.

A relation satisfies BCNF if every determinant is a candidate key.

In the proposed SecureLens database:

- Every entity has a primary key.
- User details depend on user_id.
- Project details depend on project_id.
- Scan details depend on scan_id.
- File details depend on file_id.
- Finding details depend on finding_id.
- Vulnerability information depends on vulnerability_type_id.

The proposed decomposition does not introduce non-key determinants in these tables.

Therefore, the core database relations satisfy BCNF, assuming the stated keys and functional dependencies hold.

## 7. Final Normalized Database Structure

The final logical database structure consists of:

1. **User:** Stores user account information.
2. **Project:** Stores projects created by users.
3. **Scan:** Stores code scanning information and scan status.
4. **File:** Stores individual files included in a scan.
5. **Finding:** Stores vulnerabilities identified during a scan.
6. **VulnerabilityType:** Stores standardized vulnerability information, including CWE identifiers and descriptions.

### Relationships

- One User can own multiple Projects.
- One Project can have multiple Scans.
- One Scan can contain multiple Files.
- One Scan can generate multiple Findings.
- One File can have multiple Findings.
- One VulnerabilityType can be associated with multiple Findings.

## 8. Conclusion

Database normalization helps SecureLens maintain structured and consistent information while reducing unnecessary duplication.

By organizing the database into 1NF, 2NF, 3NF, and BCNF, the design supports efficient data management, reliable relationships, easier maintenance, and future scalability as additional programming languages and vulnerability categories are introduced.