import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Search, QrCode, Clock, Users } from "lucide-react";
import { getPermitTypeInfo } from "../../data/mockData";
import type { Worker } from "../../types";
import { useStore } from "../../store/AppStore";

const CHECKS = [
  { id: "blacklist", label: "Blacklist Check", icon: "🚫", override: false },
  { id: "watchlist", label: "Watchlist / Hold for SO", icon: "⚠️", override: true },
  { id: "company", label: "Company Status Active", icon: "🏢", override: true },
  { id: "documents", label: "Mandatory Documents Valid", icon: "📄", override: true },
  { id: "permit", label: "Active Permit Linked", icon: "📋", override: true },
  { id: "certification", label: "Certification for Permit Type", icon: "🎓", override: true },
];

function RunChecks({ worker }: { worker: Worker }) {
  const { state } = useStore();
  const permit = state.permits.find(p => p.workers.some(w => w.id === worker.id) && p.status === "Active");
  const contractor = state.contractors.find(c => c.id === worker.contractorId);
  const results = [
    { id: "blacklist", pass: worker.status !== "Blacklisted", reason: worker.status === "Blacklisted" ? "Worker is BLACKLISTED — entry denied" : null },
    { id: "watchlist", pass: true, reason: null },
    { id: "company", pass: contractor?.status === "Active", reason: contractor?.status !== "Active" ? `Company status: ${contractor?.status}` : null },
    { id: "documents", pass: worker.certifications.every(c => c.status !== "Expired"), reason: worker.certifications.some(c => c.status === "Expired") ? `Expired: ${worker.certifications.find(c => c.status === "Expired")?.name}` : null },
    { id: "permit", pass: !!permit, reason: !permit ? "No active permit found for today" : null },
    { id: "certification", pass: worker.certifications.filter(c => c.status === "Expired").length === 0, reason: null },
  ];

  const allPass = results.every(r => r.pass);
  const firstFail = results.find(r => !r.pass);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: 8 }}>{allPass ? "✅" : "🚫"}</div>
        <div style={{ fontSize: "1.2rem", fontWeight: 700, color: allPass ? "#16A34A" : "#DC2626" }}>
          {allPass ? "ENTRY PERMITTED" : "ENTRY BLOCKED"}
        </div>
        {!allPass && firstFail && (
          <div style={{ fontSize: "0.82rem", color: "#DC2626", marginTop: 4 }}>{firstFail.reason}</div>
        )}
      </div>

      {/* Worker card */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem", background: "#F9FAFB", borderRadius: 10, marginBottom: "1.25rem" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: allPass ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, color: allPass ? "#16A34A" : "#DC2626", border: `2px solid ${allPass ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}` }}>
          {worker.photo}
        </div>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#2C2C2C" }}>{worker.name}</div>
          <div style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{worker.role} · {contractor?.name}</div>
          {permit && (
            <div style={{ fontSize: "0.72rem", color: "#F58634", marginTop: 3 }}>
              🔗 {permit.number} · {permit.type} · {permit.area}
            </div>
          )}
        </div>
      </div>

      {/* 6 checks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {results.map((r, i) => {
          const check = CHECKS[i];
          return (
            <div
              key={r.id}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: r.pass ? "rgba(22,163,74,0.05)" : "rgba(220,38,38,0.08)",
                border: `1px solid ${r.pass ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.25)"}`,
                borderRadius: 8, fontSize: "0.82rem",
              }}
            >
              <span>{check.icon}</span>
              <span style={{ flex: 1, color: "#2C2C2C" }}>{check.label}</span>
              {r.pass ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#16A34A", fontWeight: 700 }}>
                  <CheckCircle size={14} /> PASS
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#DC2626", fontWeight: 700 }}>
                  <XCircle size={14} /> FAIL
                </span>
              )}
            </div>
          );
        })}
      </div>

      {allPass && (
        <div style={{ marginTop: "1.25rem", display: "flex", gap: 10 }}>
          <button className="btn btn-success btn-lg" style={{ flex: 1 }}>
            ✅ Confirm Check-In
          </button>
        </div>
      )}
      {!allPass && (
        <div style={{ marginTop: "1.25rem", display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-lg" style={{ flex: 1 }}>
            Notify Safety Officer
          </button>
        </div>
      )}
    </div>
  );
}

export default function GateEntry({ viewMode }: { viewMode: "web" | "tablet" }) {
  const { state } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [mode, setMode] = useState<"search" | "qr">("search");
  const isTablet = viewMode === "tablet";

  const filtered = searchQuery.length > 1
    ? state.workers.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const activePermits = state.permits.filter(p => p.status === "Active");

  return (
    <div style={{ padding: "1.5rem", maxWidth: isTablet ? "100%" : 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>Gate Entry Interface</h1>
        <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>6-step automated compliance check · Tablet-optimized guard view</p>
      </div>

      {/* Live stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Workers Inside", value: 6, icon: Users, color: "#F58634" },
          { label: "Active Permits", value: activePermits.length, icon: CheckCircle, color: "#16A34A" },
          { label: "Compliance Failures (24h)", value: 2, icon: AlertTriangle, color: "#DC2626" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="ptw-card" style={{ textAlign: "center", padding: "1rem" }}>
            <Icon size={20} color={color} style={{ margin: "0 auto 6px" }} />
            <div style={{ fontSize: isTablet ? "2rem" : "1.6rem", fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: "1.25rem" }}>
        {/* Left: scan area */}
        <div>
          {/* Mode toggle */}
          <div style={{ display: "flex", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: 3, marginBottom: "1rem" }}>
            {[{ id: "qr", label: "QR Scan", icon: QrCode }, { id: "search", label: "Manual Search", icon: Search }].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id as "qr" | "search")}
                style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.8rem", fontWeight: 600, background: mode === id ? "#F58634" : "transparent", color: mode === id ? "#fff" : "#6A6A6A" }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {mode === "qr" ? (
            <div className="ptw-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
              <QrCode size={48} color="#F58634" style={{ margin: "0 auto 16px" }} />
              <p style={{ color: "#6A6A6A", fontSize: "0.85rem", marginBottom: "1rem" }}>Point camera at worker QR badge</p>
              <div style={{ width: 160, height: 160, border: "2px dashed #F58634", borderRadius: 12, margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#6A6A6A" }}>
                Camera feed
              </div>
              <button className="btn btn-ghost" onClick={() => setMode("search")}>Use manual search instead</button>
            </div>
          ) : (
            <div>
              <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6A6A6A" }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or ID…"
                  style={{ paddingLeft: 36, fontSize: "0.9rem", padding: "10px 12px 10px 36px" }}
                />
              </div>
              {filtered.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {filtered.map(w => {
                    const permit = state.permits.find(p => p.workers.some(pw => pw.id === w.id) && p.status === "Active");
                    return (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWorker(w)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#2C2C2C" }}>
                          {w.photo}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2C2C2C" }}>{w.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{w.role}</div>
                        </div>
                        {permit ? (
                          <span style={{ fontSize: "0.68rem", color: "#16A34A", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 4, padding: "2px 6px" }}>
                            {getPermitTypeInfo(permit.type).icon} {permit.number}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.68rem", color: "#DC2626" }}>No permit</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {searchQuery.length > 1 && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem", color: "#6A6A6A", fontSize: "0.82rem" }}>No workers found</div>
              )}
            </div>
          )}
        </div>

        {/* Right: compliance result */}
        <div className="ptw-card">
          {selectedWorker ? (
            <RunChecks worker={selectedWorker} />
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#6A6A6A" }}>
              <Users size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontSize: "0.85rem" }}>Scan QR code or search worker to run compliance checks</p>
              <p style={{ fontSize: "0.72rem", marginTop: 6 }}>6-step check completes in under 2 seconds</p>
            </div>
          )}
        </div>
      </div>

      {/* Active permits at gate */}
      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Active Permits — Headcount Status</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {activePermits.map(permit => {
            const typeInfo = getPermitTypeInfo(permit.type);
            return (
              <div key={permit.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "0.82rem" }}>
                <span>{typeInfo.icon}</span>
                <span style={{ fontWeight: 700, color: "#2C2C2C", flex: 1 }}>{permit.number}</span>
                <span style={{ color: "#6A6A6A" }}>{permit.area}</span>
                <span style={{ color: "#6A6A6A" }}>👷 {permit.headcountInside}/{permit.workerCount}</span>
                <Clock size={11} color="#6A6A6A" />
                <span style={{ color: "#6A6A6A", fontSize: "0.72rem" }}>
                  {permit.expiresAt ? new Date(permit.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
