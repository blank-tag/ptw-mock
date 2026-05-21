import { useState, useRef, useEffect } from "react";
import { Monitor, Tablet, Bell, Plus, AlertTriangle, ChevronDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROLES, type RoleId, type RolePersona } from "../../data/roles";

interface TopBarProps {
  viewMode: "web" | "tablet";
  onToggleView: () => void;
  title: string;
  role: RolePersona;
  onRoleChange: (id: RoleId) => void;
}

export default function TopBar({ viewMode, onToggleView, title, role, onRoleChange }: TopBarProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", padding: "0 1.25rem", height: 52, display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#2C2C2C" }}>{title}</span>
      </div>

      {/* Role Switcher */}
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#F9FAFB", border: "1px solid #E5E7EB",
            borderRadius: 8, padding: "5px 10px 5px 8px",
            cursor: "pointer", color: "#2C2C2C", fontSize: "0.75rem",
            minWidth: 190,
          }}
        >
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${role.color}22`, border: `1.5px solid ${role.color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={11} color={role.color} />
          </div>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.72rem", color: "#2C2C2C", lineHeight: 1.2 }}>{role.name}</div>
            <div style={{ fontSize: "0.65rem", color: role.color, lineHeight: 1.2 }}>{role.label}</div>
          </div>
          <ChevronDown size={12} color="#6A6A6A" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 200,
            minWidth: 280, padding: "6px",
          }}>
            <div style={{ fontSize: "0.65rem", color: "#6A6A6A", padding: "4px 10px 6px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Switch Role Persona
            </div>
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => { onRoleChange(r.id); navigate(r.defaultRoute); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "7px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: role.id === r.id ? `${r.color}15` : "transparent",
                  color: "#2C2C2C", textAlign: "left",
                  outline: role.id === r.id ? `1px solid ${r.color}33` : "none",
                }}
              >
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${r.color}20`, border: `1.5px solid ${r.color}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={12} color={r.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#2C2C2C" }}>{r.name}</div>
                  <div style={{ fontSize: "0.65rem", color: r.color }}>{r.label}</div>
                </div>
                {role.id === r.id && (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alerts badge */}
      <button style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#DC2626", fontSize: "0.75rem", fontWeight: 600 }}>
        <AlertTriangle size={13} />
        <span>3 Active Alerts</span>
      </button>

      {/* New Permit — only for roles that can create */}
      {role.canCreatePermit && (
        <button
          onClick={() => navigate("/permits/new")}
          className="btn btn-primary btn-sm"
          style={{ gap: 5 }}
        >
          <Plus size={13} />
          New Permit
        </button>
      )}

      {/* View toggle */}
      <div style={{ display: "flex", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: 2, gap: 2 }}>
        <button
          onClick={() => viewMode !== "web" && onToggleView()}
          style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 600, background: viewMode === "web" ? "#F58634" : "transparent", color: viewMode === "web" ? "#fff" : "#6A6A6A" }}
        >
          <Monitor size={12} /> Web
        </button>
        <button
          onClick={() => viewMode !== "tablet" && onToggleView()}
          style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 600, background: viewMode === "tablet" ? "#F58634" : "transparent", color: viewMode === "tablet" ? "#fff" : "#6A6A6A" }}
        >
          <Tablet size={12} /> Tablet
        </button>
      </div>

      <button style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6A6A6A", position: "relative" }}>
        <Bell size={14} />
        <span style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, background: "#DC2626", borderRadius: "50%", border: "1.5px solid #FFFFFF" }} />
      </button>
    </header>
  );
}
