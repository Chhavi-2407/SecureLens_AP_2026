import { Menu, Search, Bell, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const pageNames = {
  "/": "Overview",
  "/projects": "Projects",
  "/scans/new": "New scan",
  "/scans/history": "Scan history",
  "/vulnerabilities": "Vulnerabilities",
  "/settings": "Settings",
};

export default function Topbar({ onMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageNames[location.pathname] || "Workspace";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open menu">
          <Menu size={21} />
        </button>
        <div className="breadcrumb">
          <span>Workspace</span>
          <span className="breadcrumb-divider">/</span>
          <strong>{title}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="search-trigger" aria-label="Search">
          <Search size={16} />
          <span>Search anything</span>
          <kbd>⌘ K</kbd>
        </button>
        <button className="icon-button notification-button" aria-label="Notifications">
          <Bell size={19} />
          <i />
        </button>
        <button className="topbar-cta" onClick={() => navigate("/scans/new")}>
          <Plus size={17} />
          <span>New scan</span>
        </button>
      </div>
    </header>
  );
}
