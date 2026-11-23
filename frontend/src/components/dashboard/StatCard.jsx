import {
  ScanLine, ShieldAlert, AlertTriangle, FolderKanban, ArrowUpRight
} from "lucide-react";

const icons = {
  scan: ScanLine,
  critical: ShieldAlert,
  high: AlertTriangle,
  projects: FolderKanban,
};

export default function StatCard({ stat }) {
  const Icon = icons[stat.icon];

  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span>{stat.label}</span>
        <div className={`stat-icon ${stat.tone}`}><Icon size={18} /></div>
      </div>
      <div className="stat-value">{stat.value}</div>
      <div className="stat-foot">
        <span>{stat.change}</span>
        <ArrowUpRight size={14} />
      </div>
    </article>
  );
}
