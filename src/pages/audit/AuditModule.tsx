import { useState } from "react";
import { Video, Camera, ClipboardList, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import {
  mockPermits, mockNCs, mockAudits, getPermitTypeInfo, getStatusBg, getStatusColor,
} from "../../data/mockData";
import type { NonConformance } from "../../types";

const FALLBACK_METHODS = [
  { id: "A", label: "Plan A — AI Video", icon: Video, desc: "Record guided video, AI analyses compliance points. Standard method.", color: "#F58634" },
  { id: "B", label: "Plan B — Photos + Checklist", icon: Camera, desc: "Photographs + manual checklist. Used when video fails or AI inconclusive.", color: "#D97706" },
  { id: "C", label: "Plan C — Manual Checklist", icon: ClipboardList, desc: "Minimum viable. Always available as fallback. Produces formal audit record.", color: "#6A6A6A" },
];

const AI_RESULTS = [
  { control: "Fire extinguisher present and accessible", status: "Compliant", confidence: 94, icon: "🧯" },
  { control: "Fire watch designated for 30 min post-work", status: "Non-Compliant", confidence: 92, icon: "👁️" },
  { control: "Combustibles removed / covered within 10m", status: "Compliant", confidence: 88, icon: "🚧" },
  { control: "Gas testing confirmed clear", status: "Unable to Determine", confidence: 62, icon: "🧪" },
  { control: "PPE worn by all workers", status: "Compliant", confidence: 96, icon: "⛑️" },
];

function NCCard({ nc }: { nc: NonConformance }) {
  const sevColor = nc.severity === "Critical" ? "#DC2626" : nc.severity === "Major" ? "#D97706" : "#6A6A6A";
  const statusColor = nc.status === "Closed" ? "#16A34A" : nc.status === "Open" ? "#DC2626" : "#D97706";
  return (
    <div style={{ padding: "0.9rem 1rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2C2C2C", flex: 1 }}>{nc.control}</div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 4, background: `${sevColor}18`, color: sevColor, border: `1px solid ${sevColor}40`, fontWeight: 700 }}>
            {nc.severity}
          </span>
          <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 4, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40`, fontWeight: 700 }}>
            {nc.status}
          </span>
        </div>
      </div>
      <div style={{ fontSize: "0.78rem", color: "#6A6A6A", marginBottom: 6 }}>{nc.description}</div>
      {nc.aiConfidence && (
        <div style={{ fontSize: "0.7rem", color: "#7C3AED", display: "flex", alignItems: "center", gap: 4 }}>
          🤖 AI Confidence: {nc.aiConfidence}%
          {nc.aiConfidence > 90 ? " (High)" : nc.aiConfidence > 70 ? " (Moderate)" : " (Low — manual verify)"}
        </div>
      )}
      {nc.correctiveAction && (
        <div style={{ marginTop: 6, fontSize: "0.75rem", color: "#16A34A" }}>
          ✓ Corrective Action: {nc.correctiveAction}
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: "0.7rem", color: "#6A6A6A" }}>
        Raised by {nc.raisedBy} · {new Date(nc.raisedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        {nc.closedAt && ` · Closed ${new Date(nc.closedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
      </div>
    </div>
  );
}

function AuditFlow({ permit, onClose }: { permit: typeof mockPermits[0]; onClose: () => void }) {
  const [method, setMethod] = useState<string>("");
  const [videoStep, setVideoStep] = useState(0);
  const [aiDone, setAiDone] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, "confirm" | "dismiss">>({});
  const typeInfo = getPermitTypeInfo(permit.type);

  const VIDEO_PROMPTS = [
    "📹 Film the complete work area from 3m distance",
    "📹 Zoom in on fire extinguisher — confirm label visible",
    "📹 Pan to show fire watch person in position",
    "📹 Film all workers — confirm PPE is worn",
    "📹 Show gas testing equipment and reading",
  ];

  const allDecided = AI_RESULTS.filter(r => r.status !== "Compliant").every(r => decisions[r.control]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
          <span>{typeInfo.icon}</span>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#2C2C2C", flex: 1 }}>Audit — {permit.number}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Method selection */}
        {!method && (
          <div>
            <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginBottom: "1.25rem" }}>Select audit method (Feature 6.8 — Fallback Hierarchy A/B/C):</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FALLBACK_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "1rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
                >
                  <m.icon size={20} color={m.color} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2C2C2C" }}>{m.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6A6A6A", marginTop: 3 }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Plan A: Guided Video */}
        {method === "A" && !aiDone && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
              <Video size={16} color="#F58634" />
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#F58634" }}>Guided Video Capture</span>
              <span style={{ fontSize: "0.72rem", color: "#6A6A6A", marginLeft: "auto" }}>Video {videoStep + 1} of {VIDEO_PROMPTS.length}</span>
            </div>

            {/* Camera simulation */}
            <div style={{ background: "#FFFBF8", border: "1px solid #E5E7EB", borderRadius: 10, padding: "2rem", textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.78rem", color: "#F58634", fontWeight: 600, marginBottom: "1rem", background: "rgba(245,134,52,0.1)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(245,134,52,0.2)" }}>
                {VIDEO_PROMPTS[videoStep]}
              </div>
              <div style={{ width: "100%", height: 160, background: "#FFFFFF", border: "2px dashed #E5E7EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", color: "#6A6A6A", marginBottom: "1rem" }}>
                📷 Camera live feed — min 15 sec · Check brightness + motion
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button className="btn btn-primary" onClick={() => {
                  if (videoStep < VIDEO_PROMPTS.length - 1) setVideoStep(v => v + 1);
                  else setAiDone(true);
                }}>
                  {videoStep < VIDEO_PROMPTS.length - 1 ? "✓ Record & Next" : "✓ Submit All Videos for AI Analysis"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              {VIDEO_PROMPTS.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < videoStep ? "#16A34A" : i === videoStep ? "#F58634" : "#E5E7EB" }} />
              ))}
            </div>
          </div>
        )}

        {/* AI Results */}
        {method === "A" && aiDone && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
              <span>🤖</span>
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#7C3AED" }}>AI Analysis Results</span>
              <span style={{ fontSize: "0.7rem", color: "#6A6A6A", marginLeft: "auto" }}>Processing: 45 sec · Review each finding</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1.25rem" }}>
              {AI_RESULTS.map(r => {
                const col = r.status === "Compliant" ? "#16A34A" : r.status === "Non-Compliant" ? "#DC2626" : "#D97706";
                const dec = decisions[r.control];
                return (
                  <div key={r.control} style={{ padding: "10px 12px", background: "#F9FAFB", border: `1px solid ${col}30`, borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r.status !== "Compliant" ? 8 : 0 }}>
                      <span>{r.icon}</span>
                      <span style={{ flex: 1, fontSize: "0.8rem", color: "#2C2C2C" }}>{r.control}</span>
                      <span style={{ fontSize: "0.7rem", color: "#6A6A6A" }}>AI: {r.confidence}%</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: col }}>{r.status}</span>
                    </div>
                    {r.status !== "Compliant" && (
                      <div style={{ display: "flex", gap: 6, marginLeft: 24 }}>
                        <button
                          onClick={() => setDecisions(d => ({ ...d, [r.control]: "confirm" }))}
                          className={`btn btn-sm ${dec === "confirm" ? "btn-danger" : "btn-ghost"}`}
                        >
                          <CheckCircle size={11} /> Confirm NC
                        </button>
                        <button
                          onClick={() => setDecisions(d => ({ ...d, [r.control]: "dismiss" }))}
                          className={`btn btn-sm ${dec === "dismiss" ? "btn-warning" : "btn-ghost"}`}
                        >
                          <XCircle size={11} /> Dismiss (add reason)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(245,134,52,0.06)", border: "1px solid rgba(245,134,52,0.15)", borderRadius: 8, fontSize: "0.78rem", color: "#6A6A6A" }}>
              <strong style={{ color: "#F58634" }}>Feature 6.7:</strong> Every AI flag must be reviewed. Confirmed → NC created. Dismissed → mandatory reason. Auditor can manually add NCs not caught by AI.
            </div>

            <button className="btn btn-success" disabled={!allDecided} style={{ width: "100%", opacity: allDecided ? 1 : 0.4 }}>
              Submit Audit Record
            </button>
          </div>
        )}

        {/* Plan C: Manual checklist */}
        {method === "C" && (
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#6A6A6A", marginBottom: "1rem" }}>Manual Checklist — {permit.type}</div>
            {AI_RESULTS.map((r, i) => (
              <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.82rem", cursor: "pointer" }}>
                <input type="checkbox" style={{ width: "auto" }} />
                <span style={{ flex: 1, color: "#2C2C2C" }}>{r.control}</span>
              </label>
            ))}
            <button className="btn btn-primary" style={{ marginTop: "1rem", width: "100%" }}>Submit Manual Audit</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuditModule({ viewMode }: { viewMode: "web" | "tablet" }) {
  const [auditPermit, setAuditPermit] = useState<typeof mockPermits[0] | null>(null);
  const activePermits = mockPermits.filter(p => p.status === "Active");
  const isTablet = viewMode === "tablet";

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>Audit Module — AI-Assisted</h1>
        <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>
          AI video analysis · Plan A/B/C fallback hierarchy · Real-time NC management
        </p>
      </div>

      {/* Audit compliance header */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2,1fr)" : "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { l: "Audits Today", v: 3, c: "#F58634" },
          { l: "Plan A (AI Video)", v: 2, c: "#16A34A" },
          { l: "Plan B/C (Fallback)", v: 1, c: "#D97706" },
          { l: "Overdue Audits", v: 1, c: "#DC2626" },
        ].map(({ l, v, c }) => (
          <div key={l} className="ptw-card" style={{ textAlign: "center", padding: "0.9rem" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: "1.25rem" }}>
        {/* Active permits for audit */}
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Permits Eligible for Audit</div>
          {activePermits.map(permit => {
            const typeInfo = getPermitTypeInfo(permit.type);
            const existingAudit = mockAudits.find(a => a.permitId === permit.number);
            return (
              <div key={permit.id} className="ptw-card" style={{ marginBottom: 8, padding: "0.9rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{typeInfo.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2C2C2C" }}>{permit.number}</div>
                    <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{permit.area}</div>
                  </div>
                  {existingAudit ? (
                    <span style={{ fontSize: "0.7rem", color: "#16A34A", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 4, padding: "2px 7px" }}>
                      {existingAudit.outcome}
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.7rem", color: "#D97706", background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 4, padding: "2px 7px" }}>
                      OVERDUE
                    </span>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setAuditPermit(permit)}
                    style={{ gap: 4 }}
                  >
                    <Video size={11} /> Audit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* NC Management */}
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Non-Conformances</div>
          {mockNCs.map(nc => <NCCard key={nc.id} nc={nc} />)}
        </div>
      </div>

      {/* Audit history */}
      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Audit History</div>
        <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Permit</th>
                <th>Auditor</th>
                <th>Method</th>
                <th>Outcome</th>
                <th>NCs</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {mockAudits.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 700, color: "#2C2C2C" }}>{a.id}</td>
                  <td style={{ color: "#F58634" }}>{a.permitId}</td>
                  <td style={{ color: "#6A6A6A" }}>{a.auditor}</td>
                  <td>
                    <span style={{ fontSize: "0.72rem", background: a.method === "Plan A" ? "rgba(245,134,52,0.1)" : "rgba(217,119,6,0.1)", color: a.method === "Plan A" ? "#F58634" : "#D97706", border: `1px solid ${a.method === "Plan A" ? "rgba(245,134,52,0.2)" : "rgba(217,119,6,0.2)"}`, borderRadius: 4, padding: "2px 7px" }}>
                      {a.method}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: a.outcome === "Compliant" ? "#16A34A" : "#DC2626" }}>{a.outcome}</span>
                  </td>
                  <td style={{ color: a.ncs.length > 0 ? "#DC2626" : "#6A6A6A" }}>{a.ncs.length}</td>
                  <td style={{ fontSize: "0.75rem", color: "#6A6A6A" }}>
                    {a.completedAt ? new Date(a.completedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {auditPermit && <AuditFlow permit={auditPermit} onClose={() => setAuditPermit(null)} />}
    </div>
  );
}
