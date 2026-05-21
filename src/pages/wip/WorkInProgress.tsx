import { useState } from "react";
import {
  StopCircle, Clock, Users, AlertTriangle,
} from "lucide-react";
import {
  getPermitTypeInfo, formatCountdown, getCountdownClass, getStatusColor, getStatusBg,
} from "../../data/mockData";
import type { Permit } from "../../types";
import { useStore } from "../../store/AppStore";

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Active: { bg: "#dcfce7", text: "#16A34A", border: "#86efac" },
  Suspended: { bg: "#fef2f2", text: "#DC2626", border: "#fecaca" },
  "Revalidation Required": { bg: "#fffbeb", text: "#D97706", border: "#fef3c7" },
  Hold: { bg: "#eff6ff", text: "#F58634", border: "#bfdbfe" },
};

function PermitCard({ permit, onAction }: { permit: Permit; onAction: (p: Permit) => void }) {
  const typeInfo = getPermitTypeInfo(permit.type);
  const cdClass = permit.expiresAt ? getCountdownClass(permit.expiresAt) : "countdown-grey";
  const cd = permit.expiresAt ? formatCountdown(permit.expiresAt) : "—";
  const colors = STATUS_COLORS[permit.status] || STATUS_COLORS.Active;
  const pctLeft = permit.expiresAt && permit.approvedAt
    ? Math.max(0, (new Date(permit.expiresAt).getTime() - Date.now()) / (new Date(permit.expiresAt).getTime() - new Date(permit.approvedAt).getTime()) * 100)
    : 0;

  return (
    <div
      style={{
        background: colors.bg, border: `1px solid ${colors.border}`,
        borderRadius: 12, padding: "1.1rem 1.25rem", cursor: "pointer",
        transition: "opacity 0.15s",
      }}
      onClick={() => onAction(permit)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.4rem" }}>{typeInfo.icon}</span>
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2C2C2C" }}>{permit.number}</div>
            <div style={{ fontSize: "0.7rem", color: "#6A6A6A" }}>{permit.type}</div>
          </div>
        </div>
        <span className="status-pill" style={{ background: getStatusBg(permit.status), color: getStatusColor(permit.status), fontSize: "0.62rem" }}>
          {permit.status}
        </span>
      </div>

      <div style={{ fontSize: "0.78rem", color: "#6A6A6A", marginBottom: 8 }}>
        📍 {permit.area}
      </div>
      <div style={{ fontSize: "0.78rem", color: "#6A6A6A", marginBottom: 10 }}>
        🏢 {permit.contractorName}
      </div>

      {/* Headcount */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Users size={12} color="#6A6A6A" />
        <span style={{ fontSize: "0.8rem", color: "#2C2C2C", fontWeight: 600 }}>{permit.headcountInside}</span>
        <span style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>/ {permit.workerCount} inside</span>
      </div>

      {/* Countdown */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Clock size={12} color="#6A6A6A" />
          <span style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>Remaining</span>
        </div>
        <span style={{ fontSize: "0.9rem", fontWeight: 700 }} className={cdClass}>{cd}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#E5E7EB", borderRadius: 2 }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${pctLeft}%`, background: pctLeft < 20 ? "#DC2626" : pctLeft < 40 ? "#D97706" : "#16A34A", transition: "width 1s" }} />
      </div>

      {/* Events */}
      {permit.operationalEvents.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {permit.operationalEvents.map(e => (
            <span key={e.id} style={{ fontSize: "0.64rem", background: "rgba(217,119,6,0.1)", color: "#D97706", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 4, padding: "1px 6px" }}>
              {e.type}
            </span>
          ))}
        </div>
      )}

      {/* NCs */}
      {permit.nonConformances.length > 0 && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "#DC2626" }}>
          <AlertTriangle size={11} /> {permit.nonConformances.filter(n => n.status === "Open").length} open NC(s)
        </div>
      )}
    </div>
  );
}

function PermitDetailModal({ permit, onClose }: { permit: Permit; onClose: () => void }) {
  const { dispatch, role } = useStore();
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const typeInfo = getPermitTypeInfo(permit.type);
  const cd = permit.expiresAt ? formatCountdown(permit.expiresAt) : "—";
  const cdClass = permit.expiresAt ? getCountdownClass(permit.expiresAt) : "countdown-grey";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "1.6rem" }}>{typeInfo.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C2C2C" }}>{permit.number}</h2>
              <span className="status-pill" style={{ background: getStatusBg(permit.status), color: getStatusColor(permit.status) }}>{permit.status}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6A6A6A" }}>{permit.area} · {permit.contractorName}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Live stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: "1.25rem" }}>
          {[
            { l: "Headcount", v: `${permit.headcountInside}/${permit.workerCount}`, c: "#F58634" },
            { l: "Time Left", v: cd, c: cdClass === "countdown-red" ? "#DC2626" : cdClass === "countdown-amber" ? "#D97706" : "#16A34A" },
            { l: "Open NCs", v: permit.nonConformances.filter(n => n.status === "Open").length, c: "#DC2626" },
            { l: "Audits", v: permit.auditRecords.length, c: "#7C3AED" },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#6A6A6A" }}>{l}</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Supervisor & Workers */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.72rem", color: "#F58634", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Assigned Workers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {permit.workers.map(w => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "#F9FAFB", borderRadius: 6, fontSize: "0.8rem" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 700 }}>{w.photo}</div>
                <span style={{ color: "#2C2C2C" }}>{w.name}</span>
                <span style={{ color: "#6A6A6A", fontSize: "0.72rem" }}>{w.role}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#16A34A", background: "rgba(22,163,74,0.1)", padding: "1px 6px", borderRadius: 4, border: "1px solid rgba(22,163,74,0.2)" }}>Inside</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        {permit.operationalEvents.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#F58634", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Operational Events</div>
            {permit.operationalEvents.map(e => (
              <div key={e.id} style={{ padding: "8px 10px", background: "#F9FAFB", borderRadius: 6, marginBottom: 4, fontSize: "0.78rem" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, color: e.type === "Suspend" ? "#DC2626" : "#D97706" }}>{e.type}</span>
                  <span style={{ color: "#6A6A6A" }}>{new Date(e.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  {e.resolved && <span style={{ marginLeft: "auto", color: "#16A34A", fontSize: "0.68rem" }}>Resolved</span>}
                </div>
                <div style={{ color: "#6A6A6A" }}>{e.reason}</div>
                <div style={{ color: "#6A6A6A", fontSize: "0.72rem" }}>By: {e.initiatedBy}</div>
              </div>
            ))}
          </div>
        )}

        {/* Hold / Suspend / Cancel actions */}
        {permit.status === "Active" && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#DC2626", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Operational Status Management</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { id: "hold", label: "⏸ HOLD", desc: "Minor pause (30 min default). Auto-escalates to Suspend.", btn: "btn-warning" },
                { id: "suspend", label: "🛑 SUSPEND", desc: "Significant event. Requires SO reinstatement approval.", btn: "btn-danger" },
                { id: "cancel", label: "✕ CANCEL", desc: "Permanent. New permit required. SO/Admin only.", btn: "btn-danger" },
              ].map(({ id, label, desc, btn }) => (
                <div key={id}>
                  <button onClick={() => setAction(action === id ? "" : id)} className={`btn btn-sm ${action === id ? btn : "btn-ghost"}`} style={{ marginBottom: 4 }}>
                    {label}
                  </button>
                  <div style={{ fontSize: "0.7rem", color: "#6A6A6A" }}>{desc}</div>
                  {action === id && (
                    <div style={{ marginTop: 8 }}>
                      <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Mandatory: state reason for this action…"
                        rows={2}
                      />
                      <button
                        className={`btn ${btn} btn-sm`}
                        style={{ marginTop: 6 }}
                        disabled={!reason}
                        onClick={() => {
                          dispatch({ type: "WIP_ACTION", id: permit.id, eventType: id === "hold" ? "Hold" : id === "suspend" ? "Suspend" : "Cancel", reason, by: role.name });
                          setAction(""); setReason(""); onClose();
                        }}
                      >
                        Confirm {label} — Notify all parties
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stop Work Authority */}
        <div style={{ padding: "0.9rem 1rem", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <StopCircle size={16} color="#DC2626" />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#DC2626" }}>Stop Work Authority</span>
            <span style={{ fontSize: "0.65rem", background: "rgba(220,38,38,0.1)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, padding: "1px 6px" }}>ONE-TAP</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "#6A6A6A", marginBottom: 10 }}>Immediately suspends permit. Records reason + timestamp. Restart requires SO + original approver.</p>
          <button className="btn btn-danger" style={{ gap: 6 }}>
            <StopCircle size={13} /> Activate Stop Work Authority
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkInProgress({ viewMode }: { viewMode: "web" | "tablet" }) {
  const { state } = useStore();
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const activePermits = state.permits.filter(p => ["Active", "Suspended", "Revalidation Required"].includes(p.status));
  const isTablet = viewMode === "tablet";

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>Work in Progress</h1>
        <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>
          Real-time monitoring · {activePermits.length} permits active · Auto-refresh every 30s
        </p>
      </div>

      {/* Summary bar */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2,1fr)" : "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Active", count: activePermits.filter(p => p.status === "Active").length, color: "#16A34A" },
          { label: "Suspended", count: activePermits.filter(p => p.status === "Suspended").length, color: "#DC2626" },
          { label: "Revalidation Due", count: activePermits.filter(p => p.status === "Revalidation Required").length, color: "#D97706" },
          { label: "Workers Inside", count: activePermits.reduce((s, p) => s + p.headcountInside, 0), color: "#F58634" },
          { label: "Open NCs", count: activePermits.reduce((s, p) => s + p.nonConformances.filter(n => n.status === "Open").length, 0), color: "#DC2626" },
        ].map(({ label, count, color }) => (
          <div key={label} className="ptw-card" style={{ textAlign: "center", padding: "0.9rem" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Permit cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr 1fr" : "repeat(3, 1fr)", gap: "1rem" }}>
        {activePermits.map(permit => (
          <PermitCard key={permit.id} permit={permit} onAction={setSelectedPermit} />
        ))}
      </div>

      {selectedPermit && (
        <PermitDetailModal permit={selectedPermit} onClose={() => setSelectedPermit(null)} />
      )}

      {/* Legend */}
      <div className="ptw-card" style={{ marginTop: "1.25rem", padding: "0.75rem 1rem" }}>
        <div style={{ fontSize: "0.72rem", color: "#6A6A6A", display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: "#2C2C2C" }}>Color Coding: </span>
          {[["#16A34A", "Active (>30% time)"], ["#D97706", "Amber (<30%)"], ["#DC2626", "Red (<1hr / Suspended)"], ["#F58634", "Hold"]].map(([c, l]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
