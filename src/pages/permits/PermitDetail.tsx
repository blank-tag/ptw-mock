import { useParams, useNavigate } from "react-router-dom";
import { getPermitTypeInfo, getStatusBg, getStatusColor, formatCountdown, getCountdownClass } from "../../data/mockData";
import { CheckCircle, AlertTriangle, Clock, Users, MapPin, Shield, XCircle } from "lucide-react";
import { useStore } from "../../store/AppStore";

export default function PermitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useStore();
  const permit = state.permits.find(p => p.id === id);

  if (!permit) return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#6A6A6A" }}>
      Permit not found. <button className="btn btn-ghost btn-sm" onClick={() => navigate("/permits")}>Back to Permits</button>
    </div>
  );

  const typeInfo = getPermitTypeInfo(permit.type);
  const cd = permit.expiresAt ? formatCountdown(permit.expiresAt) : null;
  const cdClass = permit.expiresAt ? getCountdownClass(permit.expiresAt) : "";

  // Approval pipeline
  const hasHighRisk = permit.riskAssessment.hazards.some(h => h.applicable && h.riskLevel === "High");
  const wentThroughSO = permit.status === "Under Safety Review" ||
    permit.approvalTrail.some(a => a.action === "Cleared" || a.action === "Conditional Clearance");
  const needsSO = hasHighRisk || wentThroughSO;

  // Status ordering — used to infer step completion when trail is missing
  const STATUS_ORDER = ["Draft", "Submitted", "Under Safety Review", "Pending Approval", "Approved", "Active", "Revalidation Required", "Suspended", "Closed", "Cancelled", "Rejected"];
  const currentStatusIdx = STATUS_ORDER.indexOf(permit.status);
  const pastStatus = (s: string) => currentStatusIdx > STATUS_ORDER.indexOf(s);

  const soAction = permit.approvalTrail.find(a =>
    a.action === "Cleared" || a.action === "Conditional Clearance"
  );
  const approverAction = permit.approvalTrail.find(a =>
    ["Approved", "Approved with Conditions", "Rejected", "Return for Clarification"].includes(a.action)
  );
  const isActivated = ["Active", "Closed", "Suspended", "Cancelled"].includes(permit.status);

  type StepStatus = "done" | "active" | "pending" | "rejected";
  const pipelineSteps: { key: string; label: string; designation: string; person: string; status: StepStatus; timestamp: string | null; action: string | null }[] = [
    {
      key: "submit", label: "Permit Submitted", designation: "Requester",
      person: permit.requestedBy, status: "done",
      timestamp: permit.requestDate, action: "Submitted",
    },
    ...(needsSO ? [{
      key: "so_review", label: "Safety Officer Review", designation: "Safety Officer / HSE",
      person: soAction?.person || "Safety Officer",
      // Infer done if permit has moved past the SO review stage
      status: (soAction ? "done" : permit.status === "Under Safety Review" ? "active" : pastStatus("Under Safety Review") ? "done" : "pending") as StepStatus,
      timestamp: soAction?.timestamp || null,
      action: soAction?.action || (pastStatus("Under Safety Review") && !soAction ? "Cleared" : null),
    }] : []),
    {
      key: "approval", label: "Approver Sign-off", designation: "Area In-Charge / Factory Mgr",
      person: approverAction?.person || "Approver",
      status: (approverAction ? (approverAction.action === "Rejected" ? "rejected" : "done") : permit.status === "Pending Approval" ? "active" : pastStatus("Pending Approval") ? "done" : "pending") as StepStatus,
      timestamp: approverAction?.timestamp || null,
      action: approverAction?.action || (pastStatus("Pending Approval") && !approverAction ? "Approved" : null),
    },
    {
      key: "activated", label: "Permit Activated", designation: "Gate Guard",
      person: "—",
      status: isActivated ? "done" : "pending",
      timestamp: permit.approvedAt || null, action: isActivated ? "Activated" : null,
    },
  ];
  const doneCount = pipelineSteps.filter(s => s.status === "done").length;

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/permits")}>← Back</button>
        <span style={{ color: "#6A6A6A", fontSize: "0.8rem" }}>/</span>
        <span style={{ fontWeight: 700, color: "#2C2C2C" }}>{permit.number}</span>
      </div>

      {/* Header */}
      <div className="ptw-card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: "2rem" }}>{typeInfo.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2C2C2C" }}>{permit.number}</h1>
              <span className="status-pill" style={{ background: getStatusBg(permit.status), color: getStatusColor(permit.status) }}>{permit.status}</span>
              {cd && <span style={{ fontWeight: 700 }} className={cdClass}>{cd} remaining</span>}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#6A6A6A", marginTop: 4 }}>{permit.type} · {permit.area}</div>
            <div style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{permit.contractorName}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {permit.status === "Active" && (
              <button className="btn btn-warning btn-sm" onClick={() => navigate("/wip")}>Monitor</button>
            )}
            {["Submitted", "Pending Approval", "Under Safety Review"].includes(permit.status) && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate("/approval")}>Review</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Job particulars */}
        <div className="ptw-card">
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Job Particulars</div>
          <p style={{ fontSize: "0.82rem", color: "#2C2C2C", lineHeight: 1.6, marginBottom: 10 }}>{permit.jobDescription}</p>
          {[
            { l: "Requested By", v: permit.requestedBy },
            { l: "Supervisor", v: permit.supervisorName },
            { l: "Planned Start", v: new Date(permit.plannedStart).toLocaleString("en-IN") },
            { l: "Planned End", v: new Date(permit.plannedEnd).toLocaleString("en-IN") },
            { l: "Equipment", v: permit.equipment || "—" },
          ].map(({ l, v }) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.78rem" }}>
              <span style={{ color: "#6A6A6A" }}>{l}</span>
              <span style={{ color: "#2C2C2C", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Risk assessment */}
        <div className="ptw-card">
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Risk Assessment</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {(["High", "Medium", "Low"] as const).map(r => {
              const count = permit.riskAssessment.hazards.filter(h => h.riskLevel === r && h.applicable).length;
              const col = r === "High" ? "#DC2626" : r === "Medium" ? "#D97706" : "#16A34A";
              return (
                <div key={r} style={{ flex: 1, background: "#F9FAFB", borderRadius: 6, padding: 8, textAlign: "center" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: col }}>{count}</div>
                  <div style={{ fontSize: "0.62rem", color: "#6A6A6A" }}>{r}</div>
                </div>
              );
            })}
          </div>
          {permit.riskAssessment.hazards.filter(h => h.applicable).map(h => (
            <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.78rem" }}>
              <span style={{ color: "#2C2C2C" }}>{h.description}</span>
              <span style={{ fontWeight: 700, color: h.riskLevel === "High" ? "#DC2626" : h.riskLevel === "Medium" ? "#D97706" : "#16A34A" }}>{h.riskLevel}</span>
            </div>
          ))}
          {permit.riskAssessment.requiresIsolation && (
            <div style={{ marginTop: 8, fontSize: "0.75rem", color: "#D97706", display: "flex", alignItems: "center", gap: 4 }}>
              <Shield size={11} /> Isolation: {permit.riskAssessment.isolationType}
            </div>
          )}
        </div>

        {/* Workers */}
        <div className="ptw-card">
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Workers ({permit.workers.length})
          </div>
          {permit.workers.map(w => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700 }}>{w.photo}</div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "#2C2C2C" }}>{w.name}</div>
                <div style={{ fontSize: "0.68rem", color: "#6A6A6A" }}>{w.role}</div>
              </div>
            </div>
          ))}
          {permit.workers.length === 0 && <div style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>No workers assigned yet</div>}
        </div>

        {/* Approval pipeline — full width */}
        <div className="ptw-card" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1 }}>Approval Pipeline</div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: doneCount === pipelineSteps.length ? "rgba(22,163,74,0.1)" : "rgba(217,119,6,0.1)", color: doneCount === pipelineSteps.length ? "#16A34A" : "#D97706" }}>
              {doneCount} of {pipelineSteps.length} steps complete
            </div>
          </div>

          {/* Visual stepper */}
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {pipelineSteps.map((step, idx) => {
              const dotColor = step.status === "done" ? "#16A34A" : step.status === "active" ? "#F58634" : step.status === "rejected" ? "#DC2626" : "#D1D5DB";
              const lineColor = idx > 0 && pipelineSteps[idx - 1].status === "done" ? "#16A34A" : "#E5E7EB";
              return (
                <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  {idx > 0 && (
                    <div style={{ position: "absolute", top: 15, left: "-50%", width: "100%", height: 2, background: lineColor, zIndex: 0 }} />
                  )}
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: dotColor, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, flexShrink: 0, boxShadow: step.status === "active" ? `0 0 0 4px rgba(245,134,52,0.18)` : "none" }}>
                    {step.status === "done" && <CheckCircle size={14} color="#fff" />}
                    {step.status === "rejected" && <XCircle size={14} color="#fff" />}
                    {step.status === "active" && <Clock size={14} color="#fff" />}
                    {step.status === "pending" && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9CA3AF" }}>{idx + 1}</span>}
                  </div>
                  <div style={{ marginTop: 10, textAlign: "center", padding: "0 6px", maxWidth: 130 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: step.status === "pending" ? "#9CA3AF" : "#2C2C2C" }}>{step.label}</div>
                    <div style={{ fontSize: "0.62rem", color: "#9CA3AF", marginTop: 2 }}>{step.designation}</div>
                    {step.status === "done" && step.person !== "—" && (
                      <div style={{ fontSize: "0.65rem", color: "#16A34A", marginTop: 3, fontWeight: 600 }}>{step.person.split(" (")[0]}</div>
                    )}
                    {step.action && step.status !== "pending" && (
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, marginTop: 2, color: step.status === "done" ? "#16A34A" : step.status === "active" ? "#F58634" : step.status === "rejected" ? "#DC2626" : "#9CA3AF" }}>
                        {step.action}
                      </div>
                    )}
                    {step.timestamp && step.status === "done" && (
                      <div style={{ fontSize: "0.6rem", color: "#ACACAC", marginTop: 2 }}>
                        {new Date(step.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                    {step.status === "active" && (
                      <div style={{ fontSize: "0.65rem", color: "#F58634", fontWeight: 600, marginTop: 3 }}>Awaiting action</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current status banner */}
          <div style={{ marginTop: 20, padding: "0.75rem 1rem", background: getStatusBg(permit.status), border: `1px solid ${getStatusColor(permit.status)}44`, borderRadius: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "0.8rem", color: getStatusColor(permit.status) }}>Current status: {permit.status}</span>
            <span style={{ fontSize: "0.75rem", color: "#6A6A6A" }}>
              {permit.status === "Under Safety Review" && "— Safety Officer must clear this permit before the approver can act"}
              {permit.status === "Pending Approval" && "— Awaiting Area In-Charge / Factory Manager sign-off"}
              {permit.status === "Submitted" && "— Permit submitted and in queue for review"}
              {permit.status === "Approved" && "— All approvals complete. Gate guard can activate on site."}
              {permit.status === "Active" && "— Work in progress. Periodic checks required."}
              {permit.status === "Closed" && "— Permit closed. All work complete."}
              {permit.status === "Rejected" && "— Permit was rejected. Review comments and resubmit if needed."}
            </span>
          </div>

          {/* Detailed action history */}
          {permit.approvalTrail.length > 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Action History</div>
              {permit.approvalTrail.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", alignItems: "flex-start" }}>
                  <CheckCircle size={12} color="#16A34A" style={{ marginTop: 3, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.78rem", color: "#2C2C2C", fontWeight: 600 }}>{a.person}</span>
                    <span style={{ fontSize: "0.72rem", color: "#6A6A6A", marginLeft: 4 }}>({a.designation})</span>
                    <span style={{ marginLeft: 8, fontSize: "0.72rem", fontWeight: 700, color: "#16A34A" }}>{a.action}</span>
                    <span style={{ marginLeft: 8, fontSize: "0.68rem", color: "#ACACAC" }}>{new Date(a.timestamp).toLocaleString("en-IN")}</span>
                    {a.comments && <div style={{ fontSize: "0.72rem", color: "#6A6A6A", marginTop: 2 }}>{a.comments}</div>}
                    {a.conditions && <div style={{ fontSize: "0.72rem", color: "#D97706", marginTop: 2 }}>Conditions: {a.conditions}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NCs */}
      {permit.nonConformances.length > 0 && (
        <div className="ptw-card" style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Non-Conformances ({permit.nonConformances.length})
          </div>
          {permit.nonConformances.map(nc => (
            <div key={nc.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertTriangle size={12} color="#DC2626" style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.8rem", color: "#2C2C2C" }}>{nc.control}</div>
                  <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{nc.description}</div>
                </div>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: nc.severity === "Critical" ? "#DC2626" : "#D97706" }}>{nc.severity}</span>
                <span style={{ fontSize: "0.68rem", color: "#6A6A6A" }}>{nc.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
