import { useState } from "react";
import { useParams } from "react-router-dom";
import { Shield, UserPlus, CheckCircle, AlertTriangle, X, Plus } from "lucide-react";
import { useStore } from "../../store/AppStore";
import type { Worker, Certification } from "../../types";

const CERT_OPTIONS = [
  "Safety Induction", "Hot Work Permit", "Confined Space Entry", "Working at Height",
  "Electrical Safety", "LOTO Certification", "Fire Safety", "First Aid",
  "Chemical Handling", "Excavation Safety", "Radiography Safety",
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function getExpiryStatus(date: string): "Valid" | "Expiring" | "Expired" {
  const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "Expired";
  if (diff < 30) return "Expiring";
  return "Valid";
}

interface DraftCert {
  name: string;
  expiryDate: string;
}

interface DraftWorker {
  name: string;
  role: "Worker" | "Supervisor";
  certs: DraftCert[];
}

const BLANK_WORKER: DraftWorker = { name: "", role: "Worker", certs: [] };

export default function ContractorInvite() {
  const { token } = useParams<{ token: string }>();
  const { state, dispatch } = useStore();

  // Decode token → contractorId
  let contractorId = "";
  let tokenError = false;
  try {
    if (!token) throw new Error("no token");
    const padded = token.padEnd(token.length + (4 - (token.length % 4)) % 4, "=");
    const decoded = atob(padded);
    contractorId = decoded.split(":")[0];
    if (!contractorId) throw new Error("bad token");
  } catch {
    tokenError = true;
  }

  const contractor = state.contractors.find(c => c.id === contractorId);
  const existingWorkers = state.workers.filter(w => w.contractorId === contractorId);

  const [draft, setDraft] = useState<DraftWorker>(BLANK_WORKER);
  const [submitted, setSubmitted] = useState<string[]>([]); // ids of workers added this session
  const [errors, setErrors] = useState<Record<string, string>>({});

  function addCert() {
    setDraft(d => ({ ...d, certs: [...d.certs, { name: CERT_OPTIONS[0], expiryDate: "" }] }));
  }

  function removeCert(i: number) {
    setDraft(d => ({ ...d, certs: d.certs.filter((_, idx) => idx !== i) }));
  }

  function updateCert(i: number, field: keyof DraftCert, value: string) {
    setDraft(d => ({
      ...d,
      certs: d.certs.map((c, idx) => idx === i ? { ...c, [field]: value } : c),
    }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!draft.name.trim()) e.name = "Worker name is required";
    draft.certs.forEach((c, i) => {
      if (!c.expiryDate) e[`cert_${i}`] = "Expiry date required";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const certifications: Certification[] = draft.certs.map(c => ({
      id: genId(),
      name: c.name,
      expiryDate: c.expiryDate,
      status: getExpiryStatus(c.expiryDate),
    }));

    const worker: Worker = {
      id: genId(),
      name: draft.name.trim(),
      role: draft.role,
      contractorId,
      certifications,
      status: "Active",
      photo: "",
    };

    dispatch({ type: "ADD_WORKER", payload: worker });
    setSubmitted(prev => [...prev, worker.id]);
    setDraft(BLANK_WORKER);
    setErrors({});
  }

  if (tokenError) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#FFFFFF" }}>
          <AlertTriangle size={48} color="#DC2626" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>Invalid Invite Link</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
            This invite link is invalid or has expired. Please contact your factory admin.
          </div>
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#FFFFFF" }}>
          <AlertTriangle size={48} color="#F59E0B" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>Contractor Not Found</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
            No contractor matched this invite. Please request a new link from the factory admin.
          </div>
        </div>
      </div>
    );
  }

  const sessionWorkers = state.workers.filter(w => submitted.includes(w.id));
  const allWorkers = [...existingWorkers.filter(w => !submitted.includes(w.id)), ...sessionWorkers];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #0B1120 0%, #141D2E 50%, #0B1120 100%)", padding: "2rem 1rem" }}>
      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: "linear-gradient(rgba(245,134,52,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,134,52,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 760, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "2rem" }}>
          <div style={{
            width: 44, height: 44,
            background: "linear-gradient(135deg, #F58634 0%, #E06A1A 100%)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(245,134,52,0.4)",
          }}>
            <Shield size={22} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.4px" }}>CogentPTW</div>
            <div style={{ fontSize: "0.62rem", color: "#F58634", letterSpacing: "2px", fontWeight: 700 }}>CONTRACTOR PORTAL</div>
          </div>
        </div>

        {/* Contractor banner */}
        <div style={{
          background: "rgba(245,134,52,0.08)", border: "1px solid rgba(245,134,52,0.2)",
          borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(245,134,52,0.15)", border: "1.5px solid rgba(245,134,52,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={16} color="#F58634" />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Invite for</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF" }}>{contractor.name}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
            <span style={{ fontSize: "0.7rem", color: "#22C55E", fontWeight: 600 }}>Link Active</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Add Worker Form */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "1.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
              <UserPlus size={15} color="#F58634" />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#FFFFFF" }}>Register Worker</span>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: 4, fontWeight: 600 }}>
                FULL NAME *
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="Worker's full name"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.06)", border: `1px solid ${errors.name ? "#DC2626" : "rgba(255,255,255,0.12)"}`,
                  color: "#FFFFFF", fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
                }}
              />
              {errors.name && <div style={{ fontSize: "0.65rem", color: "#DC2626", marginTop: 3 }}>{errors.name}</div>}
            </div>

            {/* Role */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: 4, fontWeight: 600 }}>
                ROLE
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["Worker", "Supervisor"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setDraft(d => ({ ...d, role: r }))}
                    style={{
                      flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid",
                      fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                      background: draft.role === r ? "rgba(245,134,52,0.2)" : "rgba(255,255,255,0.04)",
                      borderColor: draft.role === r ? "rgba(245,134,52,0.5)" : "rgba(255,255,255,0.12)",
                      color: draft.role === r ? "#F58634" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>CERTIFICATIONS</label>
                <button
                  onClick={addCert}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "rgba(245,134,52,0.15)", border: "1px solid rgba(245,134,52,0.3)",
                    borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                    fontSize: "0.68rem", color: "#F58634", fontWeight: 600,
                  }}
                >
                  <Plus size={10} /> Add
                </button>
              </div>

              {draft.certs.length === 0 && (
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                  No certifications added
                </div>
              )}

              {draft.certs.map((cert, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <select
                      value={cert.name}
                      onChange={e => updateCert(i, "name", e.target.value)}
                      style={{ flex: 1, padding: "5px 6px", borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFFFFF", fontSize: "0.72rem", outline: "none" }}
                    >
                      {CERT_OPTIONS.map(o => <option key={o} value={o} style={{ background: "#1E293B" }}>{o}</option>)}
                    </select>
                    <button onClick={() => removeCert(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(220,38,38,0.7)", padding: 2 }}>
                      <X size={12} />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", minWidth: 50 }}>Expiry</label>
                    <input
                      type="date"
                      value={cert.expiryDate}
                      onChange={e => updateCert(i, "expiryDate", e.target.value)}
                      style={{ flex: 1, padding: "4px 6px", borderRadius: 6, background: "rgba(255,255,255,0.08)", border: `1px solid ${errors[`cert_${i}`] ? "#DC2626" : "rgba(255,255,255,0.12)"}`, color: "#FFFFFF", fontSize: "0.72rem", outline: "none" }}
                    />
                  </div>
                  {errors[`cert_${i}`] && <div style={{ fontSize: "0.62rem", color: "#DC2626", marginTop: 3 }}>{errors[`cert_${i}`]}</div>}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: "100%", padding: "10px", borderRadius: 9,
                background: "linear-gradient(135deg, #F58634, #E06A1A)",
                border: "none", color: "#FFFFFF", fontSize: "0.82rem",
                fontWeight: 700, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 7,
              }}
            >
              <UserPlus size={14} />
              Register Worker
            </button>
          </div>

          {/* Worker list */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "1.25rem",
          }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "1rem" }}>
              Registered Workers
              <span style={{
                marginLeft: 8, fontSize: "0.68rem", background: "rgba(245,134,52,0.15)",
                color: "#F58634", border: "1px solid rgba(245,134,52,0.3)",
                borderRadius: 10, padding: "1px 7px", fontWeight: 600,
              }}>{allWorkers.length}</span>
            </div>

            {allWorkers.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>
                No workers registered yet
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allWorkers.map(w => {
                const isNew = submitted.includes(w.id);
                return (
                  <div key={w.id} style={{
                    background: isNew ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isNew ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 10, padding: "10px 12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: "rgba(245,134,52,0.12)", border: "1.5px solid rgba(245,134,52,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.7rem", fontWeight: 700, color: "#F58634",
                      }}>
                        {w.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#FFFFFF" }}>{w.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{w.role}</div>
                      </div>
                      {isNew && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle size={13} color="#22C55E" />
                          <span style={{ fontSize: "0.62rem", color: "#22C55E", fontWeight: 600 }}>Added</span>
                        </div>
                      )}
                    </div>

                    {w.certifications.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                        {w.certifications.map(c => {
                          const color = c.status === "Valid" ? "#22C55E" : c.status === "Expiring" ? "#F59E0B" : "#DC2626";
                          return (
                            <span key={c.id} style={{
                              fontSize: "0.6rem", padding: "1px 6px", borderRadius: 4,
                              background: `${color}15`, color, border: `1px solid ${color}30`,
                              fontWeight: 600,
                            }}>
                              {c.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "2rem", textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: "0.68rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span>Cogent Technologies Pvt. Ltd.</span>
          <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>
          <span>IS 17893:2018 §1.14B</span>
        </div>
      </div>
    </div>
  );
}
