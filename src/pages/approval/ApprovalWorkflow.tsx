import { useState } from "react";
import { CheckCircle, ShieldAlert, AlertTriangle, ChevronRight, User, Clock, ArrowLeft } from "lucide-react";
import { getStatusColor, getStatusBg, getPermitTypeInfo } from "../../data/mockData";
import type { Permit } from "../../types";
import { useStore } from "../../store/AppStore";

function DecisionContextPanel({ permit }: { permit: Permit }) {
  const { state } = useStore();
  const contractor = state.contractors.find(c => c.id === permit.contractorId);
  const hasHigh = permit.riskAssessment.hazards.some(h => h.riskLevel === "High" && h.applicable);

  return (
    <div style={{ width: 290, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: "0.72rem", color: "#F58634", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
        Decision Context Panel
      </div>

      {contractor && (
        <div className="ptw-card" style={{ padding: "0.9rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2C2C2C", marginBottom: 8 }}>Contractor Safety Scorecard</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 8, color: "#2C2C2C" }}>{contractor.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { l: "Total Permits", v: contractor.scorecard.totalPermits },
              { l: "NC Rate/100", v: `${contractor.scorecard.ncRate}%`, c: contractor.scorecard.ncRate > 10 ? "#DC2626" : "#16A34A" },
              { l: "Repeat NCs", v: contractor.scorecard.repeatNCs, c: contractor.scorecard.repeatNCs > 0 ? "#D97706" : "#16A34A" },
              { l: "Closure %", v: `${contractor.scorecard.closureCompliance}%`, c: contractor.scorecard.closureCompliance < 90 ? "#D97706" : "#16A34A" },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background: "#F9FAFB", borderRadius: 6, padding: "6px 8px" }}>
                <div style={{ fontSize: "0.62rem", color: "#6A6A6A" }}>{l}</div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: c || "#2C2C2C" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ptw-card" style={{ padding: "0.9rem" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2C2C2C", marginBottom: 8 }}>Worker Compliance</div>
        {permit.workers.length === 0 ? (
          <div style={{ fontSize: "0.75rem", color: "#6A6A6A" }}>No workers assigned</div>
        ) : (
          permit.workers.map(w => {
            const allValid = w.certifications.every(c => c.status === "Valid");
            return (
              <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.78rem" }}>
                <div>
                  <div style={{ color: "#2C2C2C" }}>{w.name}</div>
                  <div style={{ fontSize: "0.65rem", color: w.role === "Supervisor" ? "#D97706" : "#6A6A6A" }}>{w.role}</div>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: allValid ? "#16A34A" : "#DC2626" }}>
                  {allValid ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                  {allValid ? "Compliant" : "Issues"}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="ptw-card" style={{ padding: "0.9rem" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2C2C2C", marginBottom: 8 }}>Risk Assessment Summary</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {(["High", "Medium", "Low"] as const).map(risk => {
            const count = permit.riskAssessment.hazards.filter(h => h.riskLevel === risk && h.applicable).length;
            const col = risk === "High" ? "#DC2626" : risk === "Medium" ? "#D97706" : "#16A34A";
            return (
              <div key={risk} style={{ flex: 1, background: "#F9FAFB", borderRadius: 6, padding: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: col }}>{count}</div>
                <div style={{ fontSize: "0.6rem", color: "#6A6A6A" }}>{risk}</div>
              </div>
            );
          })}
        </div>
        {permit.riskAssessment.requiresIsolation && (
          <div style={{ fontSize: "0.72rem", color: "#D97706", display: "flex", alignItems: "center", gap: 4 }}>
            <ShieldAlert size={11} /> Isolation: {permit.riskAssessment.isolationType || "Required"}
          </div>
        )}
        {hasHigh && (
          <div style={{ marginTop: 6, fontSize: "0.72rem", color: "#DC2626", display: "flex", alignItems: "center", gap: 4 }}>
            <AlertTriangle size={11} /> High-risk — SO review mandatory
          </div>
        )}
      </div>

      <div className="ptw-card" style={{ padding: "0.9rem" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2C2C2C", marginBottom: 6 }}>Permit History (30 days)</div>
        {state.permits.filter(p => p.contractorId === permit.contractorId && p.id !== permit.id).slice(0, 4).map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.75rem" }}>
            <span style={{ color: "#6A6A6A" }}>{p.number}</span>
            <span style={{ color: getStatusColor(p.status) }}>{p.status}</span>
          </div>
        ))}
        {state.permits.filter(p => p.contractorId === permit.contractorId && p.id !== permit.id).length === 0 && (
          <div style={{ fontSize: "0.75rem", color: "#6A6A6A" }}>No prior permits</div>
        )}
      </div>
    </div>
  );
}

function ApprovalDetail({ permit, onClose }: { permit: Permit; onClose: () => void }) {
  const { dispatch, role } = useStore();
  const [action, setAction] = useState("");
  const [comment, setComment] = useState("");
  const [conditions, setConditions] = useState("");
  const [areaChecks, setAreaChecks] = useState<Record<string, boolean>>({});
  const [soAction, setSoAction] = useState("");
  const [soComment, setSoComment] = useState("");
  const [soConditions, setSoConditions] = useState("");
  const [done, setDone] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");

  const typeInfo = getPermitTypeInfo(permit.type);
  const hasHigh = permit.riskAssessment.hazards.some(h => h.riskLevel === "High" && h.applicable);
  const checksComplete = Object.values(areaChecks).filter(Boolean).length >= 5;

  const AREA_CHECKS = [
    "Area inspected — confirmed safe for this work type",
    "Isolations confirmed in place (if applicable)",
    "No conflicting work ongoing in area",
    "Emergency resources and fire extinguisher accessible",
    "Workers confirmed briefed on permit conditions",
  ];

  function handleSOClear() {
    dispatch({
      type: "SO_CLEAR_PERMIT",
      id: permit.id,
      soAction: soAction === "Clear for Approval" ? "Cleared" : "Conditional Clearance",
      comments: soComment || undefined,
      conditions: soConditions || undefined,
    });
    setDoneMsg(`Permit cleared for approval. Status → Pending Approval`);
    setDone(true);
  }

  function handleApproval() {
    dispatch({
      type: "PROCESS_APPROVAL",
      id: permit.id,
      approvalAction: action,
      person: role.name,
      designation: role.title,
      comments: comment || undefined,
      conditions: conditions || undefined,
    });
    const msgs: Record<string, string> = {
      "Approve": "Permit approved. Status → Active",
      "Approve with Conditions": "Permit approved with conditions. Status → Active",
      "Reject": "Permit rejected. Status → Rejected",
      "Return for Clarification": "Permit returned. Status → Draft",
    };
    setDoneMsg(msgs[action] || "Action recorded");
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#16A34A", marginBottom: 8 }}>Action Recorded</div>
        <div style={{ fontSize: "0.85rem", color: "#6A6A6A", marginBottom: "1.5rem" }}>{doneMsg}</div>
        <button className="btn btn-primary" onClick={onClose}>← Back to Approval Inbox</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{typeInfo.icon}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C2C2C" }}>{permit.number}</h2>
              <span className="status-pill" style={{ background: getStatusBg(permit.status), color: getStatusColor(permit.status) }}>{permit.status}</span>
              {hasHigh && (
                <span style={{ fontSize: "0.68rem", color: "#DC2626", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>HIGH RISK</span>
              )}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 2 }}>{permit.area} · {permit.contractorName}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ marginLeft: "auto", gap: 5 }}>
            <ArrowLeft size={13} /> Back
          </button>
        </div>

        {/* Job details */}
        <div className="ptw-card" style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Job Particulars</div>
          <p style={{ fontSize: "0.82rem", color: "#2C2C2C", lineHeight: 1.6, marginBottom: 10 }}>{permit.jobDescription}</p>
          {permit.specialInstructions && (
            <div style={{ fontSize: "0.78rem", color: "#D97706", marginBottom: 10 }}>⚠ Special Instructions: {permit.specialInstructions}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { l: "Requested By", v: permit.requestedBy.split(" (")[0] },
              { l: "Supervisor", v: permit.supervisorName || "—" },
              { l: "Workers", v: `${permit.workerCount}` },
              { l: "Planned Start", v: new Date(permit.plannedStart).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) },
              { l: "Planned End", v: new Date(permit.plannedEnd).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) },
              { l: "Isolation", v: permit.riskAssessment.requiresIsolation ? permit.riskAssessment.isolationType || "Yes" : "Not required" },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: "#F9FAFB", borderRadius: 6, padding: "6px 8px" }}>
                <div style={{ fontSize: "0.62rem", color: "#6A6A6A", textTransform: "uppercase", marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#2C2C2C" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hazards */}
        <div className="ptw-card" style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Risk Assessment — Hazards</div>
          {permit.riskAssessment.hazards.filter(h => h.applicable).map(h => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.8rem" }}>
              <span style={{ color: "#2C2C2C" }}>{h.description}</span>
              <span style={{ fontWeight: 700, color: h.riskLevel === "High" ? "#DC2626" : h.riskLevel === "Medium" ? "#D97706" : "#16A34A" }}>{h.riskLevel}</span>
            </div>
          ))}
          {permit.riskAssessment.controls.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, marginBottom: 6 }}>CONTROLS CONFIRMED</div>
              {permit.riskAssessment.controls.filter(c => c.selected).map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#6A6A6A", padding: "3px 0" }}>
                  <CheckCircle size={11} color="#16A34A" /> {c.description}
                  {c.mandatory && <span style={{ fontSize: "0.6rem", color: "#DC2626", marginLeft: 4 }}>Mandatory</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dual acknowledgement */}
        {permit.riskAssessment.requesterAck && (
          <div className="ptw-card" style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Dual Acknowledgement (IS 17893 §2.6)</div>
            {[
              { who: "Requester", ts: permit.riskAssessment.requesterAck },
              { who: "Contractor Supervisor", ts: permit.riskAssessment.supervisorAck },
            ].map(({ who, ts }) => (
              <div key={who} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.8rem" }}>
                <CheckCircle size={13} color="#16A34A" />
                <span style={{ color: "#2C2C2C" }}>{who}</span>
                <span style={{ color: "#6A6A6A", marginLeft: "auto" }}>
                  {ts ? new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* SO Review */}
        {hasHigh && permit.status === "Under Safety Review" && (
          <div className="ptw-card" style={{ marginBottom: "1rem", border: "1px solid rgba(124,58,237,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <ShieldAlert size={14} color="#7C3AED" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#7C3AED" }}>Safety Officer Review Required</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginBottom: 12 }}>
              High-risk hazards detected. Approver cannot action this permit until Safety Officer clears it.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {["Clear for Approval", "Conditional Clearance", "Return to Requester"].map(act => (
                <button key={act} onClick={() => setSoAction(act)} className={`btn btn-sm ${soAction === act ? "btn-primary" : "btn-ghost"}`}>{act}</button>
              ))}
            </div>
            {soAction === "Conditional Clearance" && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: "0.75rem", color: "#6A6A6A", display: "block", marginBottom: 4 }}>Clearance conditions</label>
                <textarea value={soConditions} onChange={e => setSoConditions(e.target.value)} rows={2} placeholder="Specify clearance conditions…" />
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: "0.75rem", color: "#6A6A6A", display: "block", marginBottom: 4 }}>SO Notes</label>
              <textarea value={soComment} onChange={e => setSoComment(e.target.value)} rows={2} placeholder="Add notes…" />
            </div>
            {soAction && soAction !== "Return to Requester" && (
              <button className="btn btn-success" onClick={handleSOClear}>
                Confirm: {soAction} →
              </button>
            )}
            {soAction === "Return to Requester" && (
              <button className="btn btn-danger" onClick={() => {
                dispatch({ type: "PROCESS_APPROVAL", id: permit.id, approvalAction: "Return for Clarification", person: role.name, designation: role.title, comments: soComment });
                setDoneMsg("Permit returned to requester for revision.");
                setDone(true);
              }}>
                Confirm: Return to Requester →
              </button>
            )}
          </div>
        )}

        {/* Area Safety Confirmation */}
        {permit.status === "Pending Approval" && (
          <div className="ptw-card" style={{ marginBottom: "1rem", border: "1px solid rgba(217,119,6,0.3)" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#D97706", marginBottom: 10 }}>
              ⚠ Area Safety Confirmation (Mandatory before approval)
            </div>
            {AREA_CHECKS.map((check, i) => (
              <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", cursor: "pointer", fontSize: "0.8rem", color: "#2C2C2C" }}>
                <input type="checkbox" checked={!!areaChecks[check]} onChange={e => setAreaChecks(p => ({ ...p, [check]: e.target.checked }))} style={{ width: "auto", marginTop: 2 }} />
                <span style={{ color: areaChecks[check] ? "#16A34A" : "#2C2C2C" }}>{check}</span>
              </label>
            ))}
            {!checksComplete && (
              <div style={{ marginTop: 6, fontSize: "0.72rem", color: "#D97706", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={11} /> Complete all 5 checks to enable approval actions
              </div>
            )}
          </div>
        )}

        {/* Approval actions */}
        {(permit.status === "Pending Approval") && (
          <div className="ptw-card">
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Approval Action</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {["Approve", "Approve with Conditions", "Reject", "Return for Clarification"].map(act => (
                <button
                  key={act}
                  onClick={() => setAction(act)}
                  disabled={!checksComplete}
                  className={`btn btn-sm ${action === act ? (act === "Reject" ? "btn-danger" : "btn-primary") : "btn-ghost"}`}
                  style={{ opacity: checksComplete ? 1 : 0.4 }}
                >
                  {act}
                </button>
              ))}
            </div>
            {action === "Approve with Conditions" && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: "0.75rem", color: "#6A6A6A", display: "block", marginBottom: 4 }}>Conditions (visible to contractor)</label>
                <textarea value={conditions} onChange={e => setConditions(e.target.value)} rows={2} placeholder="Specify approval conditions…" />
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: "0.75rem", color: "#6A6A6A", display: "block", marginBottom: 4 }}>Comments / Notes</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Add approval notes…" />
            </div>
            <button
              className={`btn ${action === "Reject" ? "btn-danger" : "btn-success"}`}
              disabled={!action || !checksComplete}
              onClick={handleApproval}
              style={{ opacity: action && checksComplete ? 1 : 0.4 }}
            >
              Confirm: {action || "Select action above"} →
            </button>
          </div>
        )}

        {/* Prior approval trail */}
        {permit.approvalTrail.length > 0 && (
          <div className="ptw-card" style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Approval Trail</div>
            {permit.approvalTrail.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.8rem", alignItems: "center" }}>
                <CheckCircle size={12} color="#16A34A" />
                <div style={{ flex: 1 }}>
                  <span style={{ color: "#2C2C2C", fontWeight: 600 }}>{a.person}</span>
                  <span style={{ color: "#6A6A6A" }}> · {a.designation}</span>
                  <span style={{ marginLeft: 8, fontWeight: 600, color: a.action.includes("Approved") || a.action === "Cleared" ? "#16A34A" : "#D97706" }}>{a.action}</span>
                  {a.conditions && <div style={{ fontSize: "0.72rem", color: "#D97706", marginTop: 2 }}>Conditions: {a.conditions}</div>}
                  {a.comments && <div style={{ fontSize: "0.72rem", color: "#6A6A6A", marginTop: 2 }}>{a.comments}</div>}
                </div>
                <span style={{ color: "#6A6A6A", fontSize: "0.72rem", flexShrink: 0 }}>
                  {new Date(a.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <DecisionContextPanel permit={permit} />
    </div>
  );
}

export default function ApprovalWorkflow({ viewMode: _viewMode }: { viewMode: "web" | "tablet" }) {
  const { state, role } = useStore();
  const [selected, setSelected] = useState<Permit | null>(null);

  const pendingPermits = state.permits.filter(p =>
    ["Submitted", "Under Safety Review", "Pending Approval"].includes(p.status)
  );

  const recentApprovals = state.permits.filter(p =>
    p.approvalTrail.length > 0 && !["Submitted", "Under Safety Review", "Pending Approval"].includes(p.status)
  );

  if (selected) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <ApprovalDetail permit={selected} onClose={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>Approval Workflow</h1>
        <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>
          {pendingPermits.length} permit(s) awaiting action · Viewing as {role.name} ({role.label})
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
        {pendingPermits.map(permit => {
          const typeInfo = getPermitTypeInfo(permit.type);
          const hasHigh = permit.riskAssessment.hazards.some(h => h.riskLevel === "High" && h.applicable);
          const isSOReview = permit.status === "Under Safety Review";
          return (
            <div
              key={permit.id}
              className="ptw-card"
              onClick={() => setSelected(permit)}
              style={{ cursor: "pointer", padding: "1rem 1.25rem", border: `1px solid ${isSOReview ? "rgba(124,58,237,0.3)" : "#E5E7EB"}` }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "1.4rem" }}>{typeInfo.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#2C2C2C" }}>{permit.number}</span>
                    <span className="status-pill" style={{ background: getStatusBg(permit.status), color: getStatusColor(permit.status) }}>{permit.status}</span>
                    {hasHigh && (
                      <span style={{ fontSize: "0.68rem", color: "#DC2626", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>HIGH RISK</span>
                    )}
                    {permit.riskAssessment.requiresIsolation && (
                      <span style={{ fontSize: "0.68rem", color: "#D97706", background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 4, padding: "1px 6px" }}>ISOLATION</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>
                    {permit.area} · {permit.contractorName} · {permit.workerCount} workers
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", color: "#6A6A6A", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                    <Clock size={11} />
                    Starts {new Date(permit.plannedStart).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: isSOReview ? "#7C3AED" : "#F58634", marginTop: 4, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", fontWeight: 600 }}>
                    {isSOReview ? "SO Review" : "Review"} <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {pendingPermits.length === 0 && (
          <div className="ptw-card" style={{ textAlign: "center", padding: "3rem", color: "#6A6A6A" }}>
            <CheckCircle size={32} style={{ margin: "0 auto 12px" }} color="#16A34A" />
            <div>All permits reviewed. No pending approvals.</div>
          </div>
        )}
      </div>

      {recentApprovals.length > 0 && (
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent Approval Activity</div>
          {recentApprovals.slice(0, 6).map(permit =>
            permit.approvalTrail.map((a, i) => (
              <div key={`${permit.id}-${i}`} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.78rem", alignItems: "center" }}>
                <User size={12} color="#6A6A6A" />
                <span style={{ color: "#2C2C2C" }}>{a.person}</span>
                <span style={{ color: "#6A6A6A" }}>{a.designation}</span>
                <span style={{ fontWeight: 600, color: a.action.includes("Approved") || a.action === "Cleared" ? "#16A34A" : a.action === "Rejected" ? "#DC2626" : "#D97706" }}>{a.action}</span>
                <span style={{ color: "#F58634", fontWeight: 600 }}>{permit.number}</span>
                <span style={{ color: "#6A6A6A", marginLeft: "auto" }}>
                  {new Date(a.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
