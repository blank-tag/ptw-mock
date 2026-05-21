import { useState } from "react";
import { getPermitTypeInfo, PERMIT_TYPES } from "../../data/mockData";
import type { Contractor } from "../../types";
import { useStore } from "../../store/AppStore";

const DOT_COLOR = { green: "#16A34A", amber: "#D97706", red: "#DC2626" } as const;

function ContractorView({ contractor }: { contractor: Contractor }) {
  const { state } = useStore();
  const [activeTab, setActiveTab] = useState<"safety" | "permits" | "workers" | "sop">("safety");
  const permits = state.permits.filter(p => p.contractorId === contractor.id);
  const workers = state.workers.filter(w => w.contractorId === contractor.id);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#2C2C2C" }}>{contractor.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: "0.7rem", background: contractor.status === "Active" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: contractor.status === "Active" ? "#16A34A" : "#DC2626", border: `1px solid ${contractor.status === "Active" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`, borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>
              {contractor.status}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#6A6A6A" }}>ID: {contractor.id}</span>
          </div>
        </div>
        {/* Scorecard mini */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { l: "NC Rate/100", v: `${contractor.scorecard.ncRate}%`, c: contractor.scorecard.ncRate > 10 ? "#DC2626" : "#16A34A" },
            { l: "Closure", v: `${contractor.scorecard.closureCompliance}%`, c: contractor.scorecard.closureCompliance >= 90 ? "#16A34A" : "#D97706" },
            { l: "Repeat NCs", v: contractor.scorecard.repeatNCs, c: contractor.scorecard.repeatNCs > 0 ? "#D97706" : "#16A34A" },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background: "#F9FAFB", borderRadius: 8, padding: "6px 10px", textAlign: "center" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: c }}>{v}</div>
              <div style={{ fontSize: "0.62rem", color: "#6A6A6A" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", marginBottom: "1.25rem" }}>
        {[
          { id: "safety", label: "IS 17893 Status" },
          { id: "permits", label: "Permit History" },
          { id: "workers", label: "Worker Compliance" },
          { id: "sop", label: "Safety Materials" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            style={{
              padding: "8px 14px", background: "none", border: "none",
              borderBottom: activeTab === id ? "2px solid #F58634" : "2px solid transparent",
              color: activeTab === id ? "#F58634" : "#6A6A6A",
              fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* IS 17893 Traffic Light */}
      {activeTab === "safety" && (
        <div>
          <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginBottom: "1rem" }}>
            IS 17893 compliance status per permit type — based on worker certifications and recent permit history (Feature 1.19)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {PERMIT_TYPES.map(pt => {
              const status = contractor.is17893Status[pt.value as keyof typeof contractor.is17893Status];
              const statusColor = DOT_COLOR[status];
              const workerCount = workers.filter(w => w.certifications.every(c => c.status === "Valid")).length;
              return (
                <div key={pt.value} style={{ background: "#F9FAFB", border: `1px solid ${statusColor}30`, borderRadius: 10, padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "1.4rem" }}>{pt.icon}</span>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: statusColor, boxShadow: `0 0 8px ${statusColor}60` }} />
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2C2C2C" }}>{pt.value}</div>
                  <div style={{ fontSize: "0.7rem", color: statusColor, marginTop: 3, fontWeight: 600, textTransform: "uppercase" }}>
                    {status === "green" ? "Compliant" : status === "amber" ? "Expiring" : "Non-Compliant"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#6A6A6A", marginTop: 4 }}>
                    {workerCount}/{workers.length} workers certified
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: 12, fontSize: "0.72rem" }}>
            {[["green", "Compliant"], ["amber", "Expiring soon"], ["red", "Non-compliant"]].map(([c, l]) => (
              <span key={c} style={{ display: "flex", alignItems: "center", gap: 5, color: "#6A6A6A" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: DOT_COLOR[c as keyof typeof DOT_COLOR], display: "inline-block" }} />{l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Permit History */}
      {activeTab === "permits" && (
        <div>
          <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginBottom: "1rem" }}>
            All permits under {contractor.name} — read only (Feature 1.20)
          </p>
          {permits.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6A6A6A" }}>No permit history found.</div>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Permit No.</th>
                  <th>Type</th>
                  <th>Area</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>NCs</th>
                </tr>
              </thead>
              <tbody>
                {permits.map(p => {
                  const typeInfo = getPermitTypeInfo(p.type);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: "#2C2C2C" }}>{p.number}</td>
                      <td><span style={{ display: "flex", alignItems: "center", gap: 5 }}>{typeInfo.icon} <span style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{p.type}</span></span></td>
                      <td style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{p.area}</td>
                      <td style={{ fontSize: "0.75rem", color: "#6A6A6A" }}>
                        {new Date(p.requestDate).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        <span className="status-pill" style={{ fontSize: "0.62rem", background: p.status === "Active" ? "rgba(22,163,74,0.1)" : p.status === "Closed" ? "rgba(74,85,104,0.3)" : "rgba(245,134,52,0.1)", color: p.status === "Active" ? "#16A34A" : p.status === "Closed" ? "#6A6A6A" : "#F58634" }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ color: p.nonConformances.length > 0 ? "#DC2626" : "#6A6A6A" }}>
                        {p.nonConformances.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Worker Compliance */}
      {activeTab === "workers" && (
        <div>
          <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginBottom: "1rem" }}>
            Worker certification compliance linked to permit type restrictions (Features 1.11, 1.16)
          </p>
          {workers.map(w => (
            <div key={w.id} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "0.9rem", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700 }}>{w.photo}</div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2C2C2C" }}>{w.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{w.role}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: "0.68rem", background: w.status === "Active" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: w.status === "Active" ? "#16A34A" : "#DC2626", border: "1px solid", borderColor: w.status === "Active" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)", padding: "2px 6px", borderRadius: 4 }}>{w.status}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {w.certifications.map(c => (
                  <span key={c.id} style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 4, background: c.status === "Valid" ? "rgba(22,163,74,0.08)" : c.status === "Expiring" ? "rgba(217,119,6,0.08)" : "rgba(220,38,38,0.08)", color: c.status === "Valid" ? "#16A34A" : c.status === "Expiring" ? "#D97706" : "#DC2626", border: `1px solid ${c.status === "Valid" ? "rgba(22,163,74,0.2)" : c.status === "Expiring" ? "rgba(217,119,6,0.2)" : "rgba(220,38,38,0.2)"}` }}>
                    {c.name} · {c.status === "Valid" ? `Valid till ${c.expiryDate}` : c.status.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SOP & Safety Materials */}
      {activeTab === "sop" && (
        <div>
          <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginBottom: "1rem" }}>
            PTW SOPs, safety rules, and work-type guidelines (Feature 1.21)
          </p>
          {[
            { cat: "PTW SOPs", items: ["PTW System Overview — IS 17893", "Hot Work SOP v2.3", "Confined Space Entry SOP", "Electrical Isolation Procedure", "Working at Height SOP"] },
            { cat: "Site Induction Materials", items: ["Site Safety Induction Pack", "Emergency Evacuation Plan", "First Aid Locations Map"] },
            { cat: "IS 17893 Guidelines", items: ["IS 17893:2022 — Full Standard", "Permit Type Requirements Matrix", "Competency Requirements by Work Type"] },
          ].map(({ cat, items }) => (
            <div key={cat} style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{cat}</div>
              {items.map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, marginBottom: 4 }}>
                  <span>📄</span>
                  <span style={{ flex: 1, fontSize: "0.8rem", color: "#2C2C2C" }}>{item}</span>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: "0.68rem" }}>Download PDF</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContractorPortal({ viewMode }: { viewMode: "web" | "tablet" }) {
  const { state } = useStore();
  const [selectedId, setSelectedId] = useState<string>(state.contractors[0]?.id || "");
  const selectedContractor = state.contractors.find(c => c.id === selectedId) || state.contractors[0];

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>Contractor Portal</h1>
        <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>
          IS 17893 compliance, permit history, worker certification management
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: viewMode === "tablet" ? "1fr" : "220px 1fr", gap: "1.25rem" }}>
        {/* Contractor list */}
        <div>
          <div style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Contractors</div>
          {state.contractors.map(c => {
            const worstStatus = Object.values(c.is17893Status).some(s => s === "red") ? "red"
              : Object.values(c.is17893Status).some(s => s === "amber") ? "amber"
              : "green";
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 12px", borderRadius: 8, border: selectedId === c.id ? "1px solid rgba(245,134,52,0.3)" : "1px solid transparent",
                  background: selectedId === c.id ? "rgba(245,134,52,0.06)" : "transparent", cursor: "pointer",
                  marginBottom: 4,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: DOT_COLOR[worstStatus as keyof typeof DOT_COLOR], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: selectedId === c.id ? "#F58634" : "#2C2C2C" }}>{c.name}</div>
                  <div style={{ fontSize: "0.65rem", color: "#6A6A6A" }}>{c.scorecard.totalPermits} permits</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="ptw-card">
          <ContractorView contractor={selectedContractor} />
        </div>
      </div>
    </div>
  );
}
