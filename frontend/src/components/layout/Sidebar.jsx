
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, ScanSearch, History,
  ShieldAlert, Settings, LogOut, ShieldCheck, Plus
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Projects", path: "/projects", icon: FolderKanban },
  { label: "New Scan", path: "/scans/new", icon: ScanSearch },
  { label: "Scan History", path: "/scans/history", icon: History },
  { label: "Vulnerabilities", path: "/vulnerabilities", icon: ShieldAlert },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon"><ShieldCheck size={22} /></div>
        <div>
          <strong>SecureLens</strong>
          <small>CODE SECURITY PLATFORM</small>
        </div>
      </div>

      <button className="sidebar-new-scan" onClick={() => {
        navigate("/scans/new");
        onNavigate?.();
      }}>
        <Plus size={17} /> New security scan
      </button>

      <div className="sidebar-section-label">WORKSPACE</div>

      <nav className="sidebar-nav">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <strong>{user?.name || "SecureLens User"}</strong>
            <small>{user?.email || "Signed in"}</small>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={17} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
