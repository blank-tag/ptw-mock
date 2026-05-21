import { useState } from "react";
import { Plus, Edit2, PauseCircle, PlayCircle, X, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { useStore } from "../../store/AppStore";
import type { Contractor, Worker, Certification } from "../../types";
import { CERT_MAPPING } from "../../data/mockData";

function AddContractorForm({ onSave, onCancel }: { onSave: (c: Contractor) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [reg, setReg] = useState("");

  const valid = name.trim().length > 2;

  function submit() {
    const id = `C${String(Date.now()).slice(-4)}`;
    const c: Contractor = {
      id,
      name: name.trim(),
      status: "Active",
      scorecard: { totalPermits: 0, totalNCs: 0, ncRate: 0, repeatNCs: 0, closureCompliance: 100 },
      is17893Status: {
        "Hot Work": "amber", "Cold Work": "amber", "Confined Space": "amber",
        "Excavation": "amber", "Electrical": "amber", "Height Work": "amber", "Radiography": "amber",
      },
    };
    onSave(c);
  }

  return (
    <div style={{ background: "rgba(245,134,52,0.06)", border: "1px solid rgba(245,134,52,0.2)", borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#F58634", marginBottom: "1rem" }}>Add New Contractor</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Company Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Contractor company name…" autoFocus />
        </div>
        <div>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Registration No.</label>
          <input value={reg} onChange={e => setReg(e.target.value)} placeholder="e.g. GST / Trade Lic No." />
        </div>
        <div>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Contact Person</label>
          <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Supervisor / Manager name" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary btn-sm" disabled={!valid} onClick={submit} style={{ opacity: valid ? 1 : 0.4 }}>
          <CheckCircle size={13} /> Save Contractor
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={13} /> Cancel</button>
      </div>
    </div>
  );
}

function AddWorkerForm({ contractors, onSave, onCancel }: {
  contractors: Contractor[];
  onSave: (w: Worker) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"Worker" | "Supervisor">("Worker");
  const [contractorId, setContractorId] = useState(contractors[0]?.id || "");
  const [certs, setCerts] = useState<{ name: string; expiry: string }[]>([{ name: "", expiry: "" }]);

  const valid = name.trim().length > 2 && contractorId;

  function addCert() { setCerts(c => [...c, { name: "", expiry: "" }]); }
  function removeCert(i: number) { setCerts(c => c.filter((_, idx) => idx !== i)); }
  function updateCert(i: number, field: "name" | "expiry", val: string) {
    setCerts(c => c.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  }

  function getCertStatus(expiry: string): "Valid" | "Expiring" | "Expired" {
    if (!expiry) return "Valid";
    const d = new Date(expiry);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (diff < 0) return "Expired";
    if (diff < 3) return "Expiring";
    return "Valid";
  }

  function submit() {
    const initials = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const certifications: Certification[] = certs
      .filter(c => c.name.trim())
      .map((c, i) => ({
        id: `cert-${Date.now()}-${i}`,
        name: c.name.trim(),
        expiryDate: c.expiry || new Date(Date.now() + 365 * 24 * 3600000).toISOString().slice(0, 10),
        status: getCertStatus(c.expiry),
      }));
    const w: Worker = {
      id: `W${String(Date.now()).slice(-4)}`,
      name: name.trim(),
      role,
      contractorId,
      certifications,
      status: "Active",
      photo: initials,
    };
    onSave(w);
  }

  const suggestedCerts = contractorId ? Array.from(new Set(Object.values(CERT_MAPPING).flat())) : [];

  return (
    <div style={{ background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.15)", borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#16A34A", marginBottom: "1rem" }}>Add New Worker</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Full Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Worker full name…" autoFocus />
        </div>
        <div>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Role *</label>
          <select value={role} onChange={e => setRole(e.target.value as any)}>
            <option value="Worker">Worker</option>
            <option value="Supervisor">Supervisor</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Contractor *</label>
          <select value={contractorId} onChange={e => setContractorId(e.target.value)}>
            {contractors.filter(c => c.status === "Active").map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Certifications */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600 }}>Certifications</label>
          <button className="btn btn-ghost btn-sm" onClick={addCert} style={{ fontSize: "0.68rem" }}>
            <Plus size={11} /> Add Cert
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {certs.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 160px 28px", gap: 6, alignItems: "center" }}>
              <select value={c.name} onChange={e => updateCert(i, "name", e.target.value)}>
                <option value="">Select or type certification…</option>
                {suggestedCerts.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" value={c.expiry} onChange={e => updateCert(i, "expiry", e.target.value)} placeholder="Expiry date" />
              <button onClick={() => removeCert(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 4 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-success btn-sm" disabled={!valid} onClick={submit} style={{ opacity: valid ? 1 : 0.4 }}>
          <CheckCircle size={13} /> Save Worker
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={13} /> Cancel</button>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<"contractors" | "workers">("contractors");
  const [showAddContractor, setShowAddContractor] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [filterContractor, setFilterContractor] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const filteredWorkers = state.workers.filter(w =>
    filterContractor === "all" || w.contractorId === filterContractor
  );

  function workerCount(cId: string) {
    return state.workers.filter(w => w.contractorId === cId).length;
  }

  function permitCount(cId: string) {
    return state.permits.filter(p => p.contractorId === cId).length;
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>System Administration</h1>
          <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>
            Manage contractors, workers, and system configuration
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => dispatch({ type: "RESET" })}
          style={{ fontSize: "0.7rem", color: "#DC2626", border: "1px solid rgba(220,38,38,0.3)" }}
        >
          Reset to Demo Data
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", marginBottom: "1.5rem" }}>
        {[
          { id: "contractors", label: `Contractors (${state.contractors.length})` },
          { id: "workers", label: `Workers (${state.workers.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#F58634" : "transparent"}`,
              color: tab === t.id ? "#F58634" : "#6A6A6A", padding: "8px 16px", cursor: "pointer",
              fontSize: "0.82rem", fontWeight: 600, marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ─── CONTRACTORS TAB ─── */}
      {tab === "contractors" && (
        <>
          {showAddContractor ? (
            <AddContractorForm
              onSave={c => { dispatch({ type: "ADD_CONTRACTOR", payload: c }); setShowAddContractor(false); }}
              onCancel={() => setShowAddContractor(false)}
            />
          ) : (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddContractor(true)} style={{ gap: 5 }}>
                <Plus size={13} /> Add Contractor
              </button>
            </div>
          )}

          <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Company Name</th>
                  <th>Status</th>
                  <th>Workers</th>
                  <th>Permits</th>
                  <th>NC Rate/100</th>
                  <th>Closure %</th>
                  <th>IS 17893 Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.contractors.map(c => {
                  const redCount = Object.values(c.is17893Status).filter(v => v === "red").length;
                  const amberCount = Object.values(c.is17893Status).filter(v => v === "amber").length;
                  const isEditing = editingId === c.id;

                  return (
                    <tr key={c.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#6A6A6A" }}>{c.id}</td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: "3px 8px", fontSize: "0.8rem" }} />
                            <button className="btn btn-success btn-sm" onClick={() => {
                              dispatch({ type: "UPDATE_CONTRACTOR", id: c.id, changes: { name: editName } });
                              setEditingId(null);
                            }}>Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{c.name}</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: c.status === "Active" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                          color: c.status === "Active" ? "#16A34A" : "#DC2626",
                          border: `1px solid ${c.status === "Active" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
                        }}>{c.status}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#2C2C2C" }}>{workerCount(c.id)}</td>
                      <td style={{ fontWeight: 600, color: "#2C2C2C" }}>{permitCount(c.id)}</td>
                      <td style={{ fontWeight: 700, color: c.scorecard.ncRate > 10 ? "#DC2626" : "#16A34A" }}>
                        {c.scorecard.ncRate}%
                      </td>
                      <td style={{ fontWeight: 700, color: c.scorecard.closureCompliance >= 90 ? "#16A34A" : "#D97706" }}>
                        {c.scorecard.closureCompliance}%
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 3 }}>
                          {redCount > 0 && (
                            <span style={{ fontSize: "0.65rem", background: "rgba(220,38,38,0.1)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 3, padding: "1px 5px" }}>
                              {redCount} Non-Compliant
                            </span>
                          )}
                          {amberCount > 0 && (
                            <span style={{ fontSize: "0.65rem", background: "rgba(217,119,6,0.1)", color: "#D97706", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 3, padding: "1px 5px" }}>
                              {amberCount} Expiring
                            </span>
                          )}
                          {redCount === 0 && amberCount === 0 && (
                            <span style={{ fontSize: "0.65rem", color: "#16A34A" }}>All Green</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                            style={{ padding: "3px 7px" }}
                            title="Edit name"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => dispatch({ type: "UPDATE_CONTRACTOR", id: c.id, changes: { status: c.status === "Active" ? "Suspended" : "Active" } })}
                            style={{ padding: "3px 7px", color: c.status === "Active" ? "#D97706" : "#16A34A" }}
                            title={c.status === "Active" ? "Suspend" : "Reactivate"}
                          >
                            {c.status === "Active" ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── WORKERS TAB ─── */}
      {tab === "workers" && (
        <>
          {showAddWorker ? (
            <AddWorkerForm
              contractors={state.contractors}
              onSave={w => { dispatch({ type: "ADD_WORKER", payload: w }); setShowAddWorker(false); }}
              onCancel={() => setShowAddWorker(false)}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", marginBottom: "1rem" }}>
              <select value={filterContractor} onChange={e => setFilterContractor(e.target.value)} style={{ width: "auto", minWidth: 220 }}>
                <option value="all">All Contractors</option>
                {state.contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn btn-success btn-sm" onClick={() => setShowAddWorker(true)} style={{ gap: 5 }}>
                <Plus size={13} /> Add Worker
              </button>
            </div>
          )}

          <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Contractor</th>
                  <th>Certifications</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map(w => {
                  const expiredCount = w.certifications.filter(c => c.status === "Expired").length;
                  const expiringCount = w.certifications.filter(c => c.status === "Expiring").length;
                  const contractor = state.contractors.find(c => c.id === w.contractorId);
                  return (
                    <tr key={w.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#6A6A6A" }}>{w.id}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(245,134,52,0.15)", border: "1px solid rgba(245,134,52,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#F58634", flexShrink: 0 }}>
                            {w.photo}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{w.name}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: w.role === "Supervisor" ? "#D97706" : "#6A6A6A" }}>{w.role}</span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "#6A6A6A" }}>{contractor?.name || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.68rem", color: "#16A34A" }}>{w.certifications.length - expiredCount - expiringCount} valid</span>
                          {expiringCount > 0 && <span style={{ fontSize: "0.68rem", color: "#D97706" }}>{expiringCount} expiring</span>}
                          {expiredCount > 0 && <span style={{ fontSize: "0.68rem", color: "#DC2626", display: "flex", alignItems: "center", gap: 2 }}><AlertTriangle size={10} />{expiredCount} expired</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: w.status === "Active" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                          color: w.status === "Active" ? "#16A34A" : "#DC2626",
                          border: `1px solid ${w.status === "Active" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
                        }}>{w.status}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => dispatch({ type: "UPDATE_WORKER", id: w.id, changes: { status: w.status === "Active" ? "Suspended" : "Active" } })}
                          style={{ padding: "3px 7px", color: w.status === "Active" ? "#D97706" : "#16A34A" }}
                        >
                          {w.status === "Active" ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
