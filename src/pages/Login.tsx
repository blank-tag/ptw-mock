import { useState } from "react";
import { ROLES } from "../data/roles";
import type { RoleId, RolePersona } from "../data/roles";
import { Shield, LogIn, ChevronRight, ClipboardCheck, Settings, Eye, HardHat, MapPin, Lock } from "lucide-react";

const ROLE_ICONS: Record<string, React.ReactNode> = {
  factory_admin: <Settings size={20} />,
  requester: <ClipboardCheck size={20} />,
  approver: <ChevronRight size={20} />,
  safety_officer: <Shield size={20} />,
  auditor: <Eye size={20} />,
  area_incharge: <MapPin size={20} />,
  contractor_supervisor: <HardHat size={20} />,
  gate_guard: <Lock size={20} />,
};

const ROLE_BG: Record<string, string> = {
  factory_admin: "rgba(255,108,140,0.12)",
  requester: "rgba(108,140,255,0.12)",
  approver: "rgba(255,196,108,0.12)",
  safety_officer: "rgba(108,255,168,0.12)",
  auditor: "rgba(196,108,255,0.12)",
  area_incharge: "rgba(255,196,108,0.12)",
  contractor_supervisor: "rgba(108,255,168,0.12)",
  gate_guard: "rgba(138,146,166,0.12)",
};

function RoleCard({ role, onClick, selected }: { role: RolePersona; onClick: () => void; selected: boolean }) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || selected;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? role.color + "60" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 14,
        padding: "1.5rem",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s ease",
        transform: active ? "translateY(-2px)" : "none",
        boxShadow: active ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${role.color}30` : "none",
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Colored top accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: role.color,
        opacity: active ? 1 : 0.4,
        transition: "opacity 0.18s ease",
      }} />

      {/* Avatar + Icon */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: ROLE_BG[role.id] || "rgba(255,255,255,0.08)",
          border: `1.5px solid ${role.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: role.color,
        }}>
          {ROLE_ICONS[role.id]}
        </div>
        {active && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: role.color,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LogIn size={14} color="#0F172A" />
          </div>
        )}
      </div>

      {/* Name + Title */}
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#FFFFFF", marginBottom: 3 }}>
          {role.name}
        </div>
        <div style={{ fontSize: "0.72rem", color: role.color, fontWeight: 600, letterSpacing: "0.3px" }}>
          {role.label}
        </div>
        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
          {role.title}
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
        {role.description}
      </div>

      {/* Nav access dots */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {role.navItems.slice(0, 5).map(item => {
          const labels: Record<string, string> = {
            "/": "Dashboard", "/permits": "Permits", "/approval": "Approval",
            "/wip": "WIP", "/audit": "Audit", "/closure": "Closure",
            "/reports": "Reports", "/gate": "Gate", "/contractor": "Contractor",
            "/admin": "Admin",
          };
          return (
            <span key={item} style={{
              fontSize: "0.62rem", padding: "2px 6px", borderRadius: 4,
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {labels[item] ?? item}
            </span>
          );
        })}
        {role.navItems.length > 5 && (
          <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)" }}>
            +{role.navItems.length - 5}
          </span>
        )}
      </div>
    </button>
  );
}

export default function Login({ onLogin }: { onLogin: (id: RoleId) => void }) {
  const [selected, setSelected] = useState<RoleId | null>(null);

  function handleSelect(id: RoleId) {
    setSelected(id);
    setTimeout(() => onLogin(id), 160);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0B1120 0%, #141D2E 50%, #0B1120 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(245,134,52,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,134,52,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        pointerEvents: "none",
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 300,
        background: "radial-gradient(ellipse, rgba(245,134,52,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52,
            background: "linear-gradient(135deg, #F58634 0%, #E06A1A 100%)",
            borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(245,134,52,0.4)",
          }}>
            <Shield size={28} color="white" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.8px", lineHeight: 1 }}>
              CogentPTW
            </div>
            <div style={{ fontSize: "0.65rem", color: "#F58634", letterSpacing: "2.5px", fontWeight: 700, marginTop: 4 }}>
              PERMIT TO WORK SYSTEM
            </div>
          </div>
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "5px 14px",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>
            IS 17893:2018 Compliant · Phase 1 Demo
          </span>
        </div>

        <div style={{ marginTop: 20, color: "rgba(255,255,255,0.35)", fontSize: "0.82rem" }}>
          Select your role to enter the system
        </div>
      </div>

      {/* Role grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.875rem",
        position: "relative", zIndex: 1,
        width: "100%",
        maxWidth: "1100px",
      }}>
        {ROLES.map(role => (
          <RoleCard
            key={role.id}
            role={role}
            onClick={() => handleSelect(role.id)}
            selected={selected === role.id}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "2.5rem", color: "rgba(255,255,255,0.18)", fontSize: "0.68rem",
        textAlign: "center", position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16,
      }}>
        <span>Cogent Technologies Pvt. Ltd.</span>
        <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>
        <span>PTW Demo v1.0</span>
        <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>
        <span>IS 17893:2018 Phase 1</span>
      </div>
    </div>
  );
}
