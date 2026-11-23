import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-column">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>SecureLens <span className="footer-dot">·</span> Static analysis workspace</span>
          <span>System status <i className="status-dot" /> Operational</span>
        </footer>
      </div>
    </div>
  );
}
