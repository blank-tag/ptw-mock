import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FileText, ClipboardCheck, DoorOpen,
  Activity, Video, Lock, BarChart2, Users,
  Shield, Menu, X, Settings,
} from "lucide-react";
import type { RolePersona } from "../../data/roles";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isTablet: boolean;
  role: RolePersona;
}

const ALL_NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/permits", icon: FileText, label: "Permits" },
  { to: "/approval", icon: ClipboardCheck, label: "Approval Workflow" },
  { to: "/gate", icon: DoorOpen, label: "Gate Entry" },
  { to: "/wip", icon: Activity, label: "Work in Progress" },
  { to: "/audit", icon: Video, label: "Audit (AI)" },
  { to: "/closure", icon: Lock, label: "Permit Closure" },
  { to: "/reports", icon: BarChart2, label: "Reports & Analytics" },
  { to: "/contractor", icon: Users, label: "Contractor Portal" },
  { to: "/admin", icon: Settings, label: "Admin Panel" },
];

export default function Sidebar({ collapsed, onToggle, isTablet: _isTablet, role }: SidebarProps) {
  const navItems = ALL_NAV_ITEMS.filter(item => role.navItems.includes(item.to));

  return (
    <aside
      style={{
        background: "#1F2937",
        borderRight: "1px solid #374151",
        width: collapsed ? 56 : 220,
        transition: "width 0.2s",
        overflow: "hidden",
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4" style={{ borderBottom: "1px solid #2a3142", minHeight: 60 }}>
        <div style={{ width: 32, height: 32, background: "rgba(245,134,52,0.15)", border: "1px solid rgba(245,134,52,0.3)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Shield size={16} color="#F58634" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#F9FAFB", lineHeight: 1.2 }}>PTW System</div>
            <div style={{ fontSize: "0.65rem", color: "#9CA3AF" }}>IS 17893 · v2.0</div>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 2 }}
        >
          {collapsed ? <Menu size={14} /> : <X size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            style={{ marginBottom: 2, padding: "8px 10px" }}
            title={collapsed ? label : undefined}
          >
            <Icon size={15} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: "0.8rem" }}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — user persona */}
      {!collapsed && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid #374151" }}>
          <div style={{ fontSize: "0.68rem", color: "#9CA3AF", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: "#F9FAFB", marginBottom: 2 }}>{role.name}</div>
            <div>{role.title}</div>
            <div style={{ display: "inline-block", marginTop: 4, background: `${role.color}18`, color: role.color, border: `1px solid ${role.color}35`, padding: "1px 6px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700 }}>ONLINE</div>
          </div>
        </div>
      )}
    </aside>
  );
}
