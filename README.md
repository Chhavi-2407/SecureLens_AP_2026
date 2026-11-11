# SecureLens

**Code Vulnerability Scanner and Security Analysis Platform**

SecureLens is a full-stack Static Application Security Testing (SAST) platform designed to identify potential security vulnerabilities in source code. It aims to help developers understand security risks, locate vulnerable code, and receive actionable recommendations to improve application security.

## Problem Statement

Developers can unintentionally introduce security vulnerabilities through insecure coding practices, improper input handling, exposed credentials, and vulnerable third-party dependencies.

Finding these issues manually can be time-consuming and requires security expertise. SecureLens aims to simplify this process through automated source-code analysis and structured vulnerability reporting.

## Key Features

The planned platform includes:

- **Source Code Scanning:** Analyze source code for potential vulnerabilities.
- **Vulnerability Detection:** Identify SQL Injection, Cross-Site Scripting (XSS), Command Injection, Path Traversal, and hard-coded secrets.
- **Severity Classification:** Categorize findings according to their severity.
- **Code-Level Findings:** Display affected files, line numbers, vulnerability types, and supporting evidence.
- **Remediation Recommendations:** Suggest ways to fix detected vulnerabilities.
- **Dependency Analysis:** Identify potentially vulnerable third-party packages.
- **Scan History:** Maintain records of previous scans.
- **Security Dashboard:** Present scan statistics and findings.
- **Attack Flow Visualization:** Help users understand potentially unsafe data flows.

*These are planned capabilities. Their implementation is ongoing.*

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, JavaScript, Vite |
| Styling | CSS |
| Backend | Node.js, Express.js |
| Security Scanner | Python |
| Code Parsing | Tree-sitter |
| Database | PostgreSQL |
| API Communication | REST APIs |

## System Architecture

SecureLens is designed around three major components:

### 1. Frontend

The React frontend provides the interface for submitting source code, viewing scan results, exploring vulnerabilities, and managing projects.

### 2. Backend

The Node.js and Express backend handles API requests and coordinates communication between the frontend, scanner, and database.

### 3. Security Scanner

The Python-based scanner is planned to parse source code, analyze code structures, apply vulnerability detection rules, and generate structured findings.

### Analysis Workflow

```text
User
  |
  v
React Frontend
  |
  v
Express Backend
  |
  v
Python Security Scanner
  |
  v
Code Parsing and Analysis
  |
  v
Vulnerability Detection
  |
  v
Findings and Recommendations
  |
  v
PostgreSQL Database
  |
  v
Frontend Results
```

## Initial Language Support

The initial development scope focuses on:

- JavaScript
- TypeScript
- Python

Additional language support may be considered in future development.

## Project Structure

```text
SecureLens/
|
|-- backend/
|   |-- package.json
|   |-- package-lock.json
|   |-- server.js
|
|-- database/
|
|-- datasets/
|
|-- dbms/
|   |-- 01_normalization.md
|
|-- docs/
|
|-- frontend/
|   |-- src/
|   |-- public/
|   |-- package.json
|   |-- index.html
|   |-- vite.config.js
|
|-- scanner/
|
|-- README.md
```

*The structure will expand as development progresses.*

## Getting Started

### Prerequisites

- Node.js
- npm
- Python (for scanner integration)
- PostgreSQL (for database integration)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SecureLens
```

### 2. Start the Backend

Open a terminal:

```bash
cd backend
npm install
npm start
```

The backend runs at:

```text
http://localhost:5000
```

### 3. Start the Frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the frontend development URL in the terminal. The default is:

```text
http://localhost:5173
```

### 4. Verify the Backend

Open:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "SecureLens backend is running!"
}
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Checks whether the backend server is running |

Additional endpoints for authentication, projects, scans, and vulnerability findings are planned.

## Database Design

PostgreSQL is planned as the primary database.

The proposed logical database design includes:

- Users
- Projects
- Files
- Scans
- Findings
- Vulnerability Types
- Dependencies
- Dependency Vulnerabilities
- Scan Metrics
- Recommendations

The normalization documentation is available at `dbms/01_normalization.md`.

Database schema implementation and backend integration are pending.

## Development Status

| Component | Status |
|---|---|
| React + Vite frontend setup | Initialized |
| Express backend setup | Initialized |
| Backend health check endpoint | Implemented in code |
| Database normalization documentation | Draft completed |
| ER Diagram | Pending |
| PostgreSQL schema | Pending |
| Python scanner integration | Pending |
| Vulnerability detection rules | Pending |
| Scan API integration | Pending |
| Dashboard integration | In progress |

## Future Scope

- Implement AST-based vulnerability detection.
- Add source-to-sink data-flow analysis.
- Integrate CWE and CVE vulnerability metadata.
- Implement dependency vulnerability scanning.
- Store and retrieve scan history.
- Visualize vulnerability findings and potentially unsafe data flows.
- Expand supported programming languages and detection rules.

## Project Objective

SecureLens aims to make application security analysis more accessible by combining automated source-code scanning, structured vulnerability reporting, and practical remediation guidance in a single platform.