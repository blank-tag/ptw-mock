import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter } from "lucide-react";
import { getStatusColor, getStatusBg, getPermitTypeInfo } from "../../data/mockData";
import type { PermitStatus } from "../../types";
import { useStore } from "../../store/AppStore";

const ALL_STATUSES: PermitStatus[] = [
  "Draft", "Submitted", "Under Safety Review", "Pending Approval",
  "Approved", "Active", "Revalidation Required", "Suspended", "Closed", "Cancelled", "Rejected",
];

export default function PermitList({ viewMode }: { viewMode: "web" | "tablet" }) {
  const navigate = useNavigate();
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = state.permits.filter(p => {
    const matchSearch = p.number.toLowerCase().includes(search.toLowerCase())
      || p.area.toLowerCase().includes(search.toLowerCase())
      || p.contractorName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchType = filterType === "all" || p.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>Permit Register</h1>
          <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>All PTW permits · {filtered.length} shown</p>
        </div>
        <button onClick={() => navigate("/permits/new")} className="btn btn-primary" style={{ gap: 6 }}>
          <Plus size={14} /> New Permit
        </button>
      </div>

      {/* Filters */}
      <div className="ptw-card" style={{ padding: "0.9rem 1rem", marginBottom: "1rem", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#6A6A6A" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search permit, area, contractor…"
            style={{ paddingLeft: 30 }}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "auto", flex: "0 0 180px" }}>
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: "auto", flex: "0 0 160px" }}>
          <option value="all">All Types</option>
          {["Hot Work","Cold Work","Confined Space","Excavation","Electrical","Height Work","Radiography"].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div style={{ fontSize: "0.72rem", color: "#6A6A6A", display: "flex", alignItems: "center", gap: 4 }}>
          <Filter size={12} /> {filtered.length} results
        </div>
      </div>

      {/* Table */}
      <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Permit No.</th>
                <th>Type</th>
                <th>Area / Location</th>
                <th>Contractor</th>
                <th>Requested By</th>
                <th>Planned Start</th>
                <th>Workers</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(permit => {
                const typeInfo = getPermitTypeInfo(permit.type);
                return (
                  <tr key={permit.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/permits/${permit.id}`)}>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#2C2C2C" }}>{permit.number}</span>
                    </td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span>{typeInfo.icon}</span>
                        <span className={`status-pill ${typeInfo.typeClass}`}>{permit.type}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8rem", color: "#2C2C2C" }}>{permit.area}</div>
                      {permit.equipment && <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{permit.equipment}</div>}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#2C2C2C" }}>{permit.contractorName}</td>
                    <td style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{permit.requestedBy.split(" (")[0]}</td>
                    <td style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>
                      {new Date(permit.plannedStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#2C2C2C" }}>{permit.workerCount || "—"}</td>
                    <td>
                      <span className="status-pill" style={{ background: getStatusBg(permit.status), color: getStatusColor(permit.status) }}>
                        {permit.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={e => { e.stopPropagation(); navigate(`/permits/${permit.id}`); }}
                      >View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="ptw-card" style={{ marginTop: "1rem", padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: "0.72rem", color: "#6A6A6A" }}>
          <span style={{ fontWeight: 700, color: "#2C2C2C" }}>11 Status Values: </span>
          {ALL_STATUSES.map(s => (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: getStatusColor(s), display: "inline-block" }} />
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
