import { useState } from "react";
import { CheckCircle, Lock, FileText, Award } from "lucide-react";
import { getPermitTypeInfo, getStatusColor, getStatusBg } from "../../data/mockData";
import { useStore } from "../../store/AppStore";
import type { Permit } from "../../types";

const CLOSURE_CHECKS = [
  "All workers have exited the work area (cross-checked with gate records)",
  "Work completed (or % complete documented if partial)",
  "All tools and materials removed from area",
  "Area cleaned and restored to original condition",
  "Waste disposed as per environmental guidelines",
];

const ISOLATION_CHECKS = [
  "All isolation points removed and logged",
  "Equipment restored to operating condition",
  "All locks/tags removed and accounted for",
];

function CertificatePreview({ permit }: { permit: Permit }) {
  const typeInfo = getPermitTypeInfo(permit.type);
  return (
    <div style={{ background: "#FFFBF8", border: "1px solid #E5E7EB", borderRadius: 12, padding: "1.5rem", fontFamily: "monospace" }}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem", borderBottom: "1px solid #E5E7EB", paddingBottom: "1rem" }}>
        <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{typeInfo.icon}</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#2C2C2C" }}>PERMIT CLOSURE CERTIFICATE</div>
        <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>IS 17893:2022 Compliant · Auto-Generated</div>
        <div style={{ marginTop: 8, display: "inline-block", background: "rgba(22,163,74,0.1)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 4, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}>
          PERMIT CLOSED
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        {[
          ["Permit Number", permit.number],
          ["Permit Type", permit.type],
          ["Work Area", permit.area],
          ["Contractor", permit.contractorName],
          ["Requested By", permit.requestedBy.split(" (")[0]],
          ["Supervisor", permit.supervisorName || "—"],
          ["Total Workers", permit.workerCount],
          ["Closed", permit.closedAt ? new Date(permit.closedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleString("en-IN")],
        ].map(([l, v]) => (
          <div key={l as string}>
            <div style={{ fontSize: "0.6rem", color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 0.8 }}>{l}</div>
            <div style={{ fontSize: "0.8rem", color: "#2C2C2C", fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "0.75rem", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.68rem", color: "#6A6A6A", marginBottom: 6 }}>RISK ASSESSMENT SUMMARY</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["High", "Medium", "Low"].map(r => {
            const count = permit.riskAssessment.hazards.filter(h => h.riskLevel === r && h.applicable).length;
            return (
              <div key={r} style={{ flex: 1, background: "#FFFFFF", borderRadius: 6, padding: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: r === "High" ? "#DC2626" : r === "Medium" ? "#D97706" : "#16A34A" }}>{count}</div>
                <div style={{ fontSize: "0.6rem", color: "#6A6A6A" }}>{r} Hazards</div>
              </div>
            );
          })}
        </div>
      </div>

      {permit.approvalTrail.length > 0 && (
        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "0.75rem" }}>
          <div style={{ fontSize: "0.68rem", color: "#6A6A6A", marginBottom: 6 }}>APPROVAL CHAIN</div>
          {permit.approvalTrail.map((a, i) => (
            <div key={i} style={{ fontSize: "0.75rem", color: "#2C2C2C", marginBottom: 3 }}>
              ✓ {a.person} ({a.designation}) — {a.action}
              {a.conditions && <span style={{ color: "#D97706", fontSize: "0.68rem" }}> · Conditions: {a.conditions}</span>}
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "0.75rem", marginTop: "0.75rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {["Safety Officer: _________________", "Site Administrator: _________________"].map(s => (
          <div key={s} style={{ fontSize: "0.7rem", color: "#6A6A6A" }}>{s}</div>
        ))}
      </div>

      <div style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.6rem", color: "#9CA3AF" }}>
        QR: PTW-CERT-{permit.number} · Generated: {new Date().toISOString()} · Immutable — cannot be modified
      </div>
    </div>
  );
}

export default function PermitClosure({ viewMode }: { viewMode: "web" | "tablet" }) {
  const { state, dispatch, role } = useStore();
  const [selectedId, setSelectedId] = useState("");
  const [closureChecks, setClosureChecks] = useState<Record<string, boolean>>({});
  const [isolationChecks, setIsolationChecks] = useState<Record<string, boolean>>({});
  const [showCert, setShowCert] = useState(false);

  const closablePermits = state.permits.filter(p => ["Active", "Approved"].includes(p.status));
  const closedPermits = state.permits.filter(p => p.status === "Closed");
  const permit = state.permits.find(p => p.id === selectedId);
  const isJustClosed = permit?.status === "Closed";

  const allClosureChecks = CLOSURE_CHECKS.every(c => closureChecks[c]);
  const allIsolationChecks = !permit?.riskAssessment.requiresIsolation || ISOLATION_CHECKS.every(c => isolationChecks[c]);
  const canClose = allClosureChecks && allIsolationChecks;

  function handleSelectPermit(id: string) {
    setSelectedId(id);
    setClosureChecks({});
    setIsolationChecks({});
    setShowCert(false);
  }

  function handleClose() {
    if (!selectedId) return;
    dispatch({ type: "CLOSE_PERMIT", id: selectedId });
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>Permit Closure</h1>
        <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>
          Structured closure flow · Auto-generated Closure Certificate · Viewing as {role.name} ({role.label})
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: viewMode === "tablet" ? "1fr" : "1fr 1fr", gap: "1.25rem" }}>
        {/* Closure flow */}
        <div>
          <div className="ptw-card" style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Select Permit to Close</div>
            <select value={selectedId} onChange={e => handleSelectPermit(e.target.value)}>
              <option value="">
                {closablePermits.length === 0 ? "No active permits to close" : "Select permit…"}
              </option>
              {closablePermits.map(p => (
                <option key={p.id} value={p.id}>{p.number} — {p.type} — {p.area.slice(0, 40)}</option>
              ))}
            </select>
            {closablePermits.length === 0 && (
              <div style={{ marginTop: 8, fontSize: "0.75rem", color: "#6A6A6A" }}>
                Permits must be in Active or Approved status to be closed. Approve a permit first via the Approval Workflow.
              </div>
            )}
          </div>

          {permit && !isJustClosed && (
            <>
              <div className="ptw-card" style={{ marginBottom: "1rem", padding: "0.9rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.2rem" }}>{getPermitTypeInfo(permit.type).icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#2C2C2C" }}>{permit.number}</div>
                    <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{permit.area} · {permit.contractorName}</div>
                  </div>
                  <span className="status-pill" style={{ background: getStatusBg(permit.status), color: getStatusColor(permit.status) }}>{permit.status}</span>
                </div>
                {permit.supervisorName && (
                  <div style={{ marginTop: 8, fontSize: "0.75rem", color: "#6A6A6A" }}>
                    Supervisor: <span style={{ color: "#D97706" }}>{permit.supervisorName}</span> · {permit.workerCount} workers
                  </div>
                )}
              </div>

              <div className="ptw-card" style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#D97706", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Step 1: Supervisor Closure Confirmation
                </div>
                {CLOSURE_CHECKS.map((check, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", fontSize: "0.8rem" }}>
                    <input type="checkbox" checked={!!closureChecks[check]} onChange={e => setClosureChecks(p => ({ ...p, [check]: e.target.checked }))} style={{ width: "auto", marginTop: 2 }} />
                    <span style={{ color: closureChecks[check] ? "#16A34A" : "#2C2C2C" }}>{check}</span>
                  </label>
                ))}
              </div>

              {permit.riskAssessment.requiresIsolation && (
                <div className="ptw-card" style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#D97706", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    Step 2: Isolation Removal Confirmation
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6A6A6A", marginBottom: 8 }}>
                    Isolation type: {permit.riskAssessment.isolationType || "As specified"}
                  </div>
                  {ISOLATION_CHECKS.map((check, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", fontSize: "0.8rem" }}>
                      <input type="checkbox" checked={!!isolationChecks[check]} onChange={e => setIsolationChecks(p => ({ ...p, [check]: e.target.checked }))} style={{ width: "auto" }} />
                      <span style={{ color: isolationChecks[check] ? "#16A34A" : "#2C2C2C" }}>{check}</span>
                    </label>
                  ))}
                </div>
              )}

              {canClose && (
                <button className="btn btn-success btn-lg" style={{ width: "100%", gap: 8 }} onClick={handleClose}>
                  <Lock size={16} /> Submit Closure — Generate Certificate
                </button>
              )}
              {!canClose && selectedId && (
                <div style={{ fontSize: "0.75rem", color: "#6A6A6A", padding: "0.75rem", background: "rgba(138,146,166,0.06)", borderRadius: 8, border: "1px solid rgba(138,146,166,0.15)" }}>
                  Complete all checklist items above to enable closure submission.
                </div>
              )}
            </>
          )}

          {isJustClosed && permit && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🏆</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#16A34A", marginBottom: 4 }}>Permit Closed Successfully</div>
              <div style={{ fontSize: "0.82rem", color: "#6A6A6A", marginBottom: "1.25rem" }}>
                {permit.number} is now closed. Closure Certificate generated and archived.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="btn btn-primary" style={{ gap: 6 }} onClick={() => setShowCert(v => !v)}>
                  <FileText size={13} /> {showCert ? "Hide" : "View"} Certificate
                </button>
                <button className="btn btn-ghost" onClick={() => { setSelectedId(""); setShowCert(false); }}>
                  Close Another Permit
                </button>
              </div>
            </div>
          )}

          {isJustClosed && permit && showCert && (
            <div style={{ marginTop: "1rem" }}>
              <CertificatePreview permit={permit} />
            </div>
          )}
        </div>

        {/* Right: closed permits */}
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Closed Permits ({closedPermits.length})
          </div>
          {closedPermits.length === 0 ? (
            <div className="ptw-card" style={{ padding: "1.5rem", textAlign: "center", color: "#6A6A6A", fontSize: "0.82rem" }}>
              No permits have been closed yet.
            </div>
          ) : (
            closedPermits.map(p => {
              const typeInfo = getPermitTypeInfo(p.type);
              return (
                <div key={p.id} className="ptw-card" style={{ marginBottom: 8, padding: "0.9rem 1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1.1rem" }}>{typeInfo.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2C2C2C" }}>{p.number}</div>
                      <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{p.area}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="status-pill" style={{ background: getStatusBg(p.status), color: getStatusColor(p.status) }}>{p.status}</span>
                      <div style={{ fontSize: "0.68rem", color: "#6A6A6A", marginTop: 3 }}>
                        {p.closedAt ? new Date(p.closedAt).toLocaleDateString("en-IN") : "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Award size={11} color="#D97706" />
                    <span style={{ fontSize: "0.7rem", color: "#D97706" }}>Closure Certificate generated</span>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", fontSize: "0.65rem" }}>
                      <FileText size={10} /> View PDF
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
