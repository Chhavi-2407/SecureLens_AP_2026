
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";

import Projects from "./pages/projects/Projects";
import ProjectDetails from "./pages/projects/ProjectDetails";

import NewScan from "./pages/scans/NewScan";
import ScanResults from "./pages/scans/ScanResults";

import ScanHistory from "./pages/scans/ScanHistory";

import {
  Settings,
} from "./pages/WorkspacePages";
import Vulnerabilities from "./pages/vulnerabilities/Vulnerabilities";
import VulnerabilityDetails from "./pages/vulnerabilities/VulnerabilityDetails";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />

              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />

              {/* Scan routes */}
              <Route path="/scans/new" element={<NewScan />} />
              <Route path="/scans/history" element={<ScanHistory />} />
              <Route path="/scans/:id" element={<ScanResults />} />

              {/* Vulnerability routes */}
              <Route
                path="/vulnerabilities"
                element={<Vulnerabilities />}
              />
              <Route
                path="/vulnerabilities/:id"
                element={<VulnerabilityDetails />}
              />

              {/* Settings */}
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
