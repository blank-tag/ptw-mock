import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, AlertTriangle, ClipboardCheck, Users,
  TrendingUp, ShieldAlert, CheckCircle, Clock,
  ArrowRight,
} from "lucide-react";
import {
  ncTrend, permitVolume,
  getStatusColor, getStatusBg, getPermitTypeInfo,
  formatCountdown, getCountdownClass,
} from "../data/mockData";
import { useStore } from "../store/AppStore";

const RECENT_EVENTS = [
  { time: "08:22", type: "suspend", msg: "CS-2026-00091 — Permit SUSPENDED. Critical NC: gas monitor disabled.", color: "#DC2626" },
  { time: "08:15", type: "nc", msg: "NC004 raised on HT-2026-00102 — Major: worker without harness at height.", color: "#D97706" },
  { time: "07:55", type: "audit", msg: "Audit completed on EL-2026-00096 — COMPLIANT (Plan A).", color: "#16A34A" },
  { time: "07:30", type: "entry", msg: "6 workers entered — 3 permits. All compliance checks passed.", color: "#F58634" },
  { time: "07:10", type: "approval", msg: "HT-2026-00105 submitted for approval — Hot Work, Steam Gen Unit.", color: "#7C3AED" },
  { time: "06:45", type: "revalidation", msg: "EL-2026-00096 revalidation confirmed — Conditions unchanged.", color: "#16A34A" },
];

export default function Dashboard({ viewMode }: { viewMode: "web" | "tablet" }) {
  const navigate = useNavigate();
  const { state } = useStore();
  const isTablet = viewMode === "tablet";

  const activePermits = state.permits.filter(p => p.status === "Active");
  const wip = state.permits.filter(p => ["Active", "Suspended", "Revalidation Required"].includes(p.status));
  const openNCs = state.permits.reduce((s, p) => s + p.nonConformances.filter(n => n.status === "Open").length, 0);
  const pendingApprovals = state.permits.filter(p => ["Submitted", "Under Safety Review", "Pending Approval"].includes(p.status)).length;
  const closedMTD = state.permits.filter(p => p.status === "Closed").length;
  const workersInside = wip.reduce((s, p) => s + (p.headcountInside || 0), 0);
  const suspendedCount = state.permits.filter(p => p.status === "Suspended").length;

  const statusDistribution = [
    { name: "Active", value: state.permits.filter(p => p.status === "Active").length, color: "#16A34A" },
    { name: "Pending Approval", value: state.permits.filter(p => p.status === "Pending Approval").length, color: "#F58634" },
    { name: "Under Safety Review", value: state.permits.filter(p => p.status === "Under Safety Review").length, color: "#7C3AED" },
    { name: "Submitted", value: state.permits.filter(p => p.status === "Submitted").length, color: "#D97706" },
    { name: "Suspended", value: suspendedCount, color: "#DC2626" },
    { name: "Closed", value: closedMTD, color: "#9CA3AF" },
    { name: "Rejected", value: state.permits.filter(p => p.status === "Rejected").length, color: "#EF4444" },
  ].filter(s => s.value > 0);

  const statCards = [
    { label: "Active Permits", value: activePermits.length, icon: Activity, color: "#16A34A", bg: "rgba(22,163,74,0.08)", delta: `${wip.length} in progress` },
    { label: "Workers Inside", value: workersInside, icon: Users, color: "#F58634", bg: "rgba(245,134,52,0.08)", delta: `across ${wip.length} permits` },
    { label: "Pending Approvals", value: pendingApprovals, icon: Clock, color: "#D97706", bg: "rgba(217,119,6,0.08)", delta: pendingApprovals > 0 ? "awaiting review" : "none pending" },
    { label: "Open NCs", value: openNCs, icon: AlertTriangle, color: "#DC2626", bg: "rgba(220,38,38,0.08)", delta: openNCs > 0 ? "action required" : "all clear" },
    { label: "Compliance Score", value: "78%", icon: TrendingUp, color: "#7C3AED", bg: "rgba(124,58,237,0.08)", delta: "↓ 3pts this week" },
    { label: "H/S/C Events", value: suspendedCount, icon: ShieldAlert, color: "#D97706", bg: "rgba(217,119,6,0.08)", delta: "suspended permits" },
    { label: "Audits Due", value: state.audits.filter(a => !a.completedAt).length, icon: ClipboardCheck, color: "#F58634", bg: "rgba(245,134,52,0.08)", delta: "today" },
    { label: "Permits Closed (MTD)", value: closedMTD, icon: CheckCircle, color: "#16A34A", bg: "rgba(22,163,74,0.08)", delta: "this month" },
  ];

  return (
    <div style={{ padding: isTablet ? "1rem" : "1.5rem", maxWidth: isTablet ? "100%" : 1400 }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: isTablet ? "1.2rem" : "1.5rem", fontWeight: 700, color: "#2C2C2C" }}>Operational Dashboard</h1>
        <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginTop: 4 }}>
          Live · PTW Phase 1 · IS 17893 · As of {new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, day: "numeric", month: "short" })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {statCards.map(({ label, value, icon: Icon, color, bg, delta }) => (
          <div key={label} className="ptw-card" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: isTablet ? "1.6rem" : "2rem", fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: "0.72rem", color: "#2C2C2C", fontWeight: 600, marginTop: 2 }}>{label}</div>
                <div style={{ fontSize: "0.68rem", color: "#6A6A6A", marginTop: 2 }}>{delta}</div>
              </div>
              <div style={{ width: 36, height: 36, background: bg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Permits Monitor */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 320px", gap: "1rem", marginBottom: "1rem" }}>
        <div className="ptw-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Active Permit Monitor</h3>
            <button onClick={() => navigate("/wip")} className="btn btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {wip.map(permit => {
              const typeInfo = getPermitTypeInfo(permit.type);
              const cdClass = permit.expiresAt ? getCountdownClass(permit.expiresAt) : "countdown-grey";
              const cd = permit.expiresAt ? formatCountdown(permit.expiresAt) : "—";
              return (
                <div
                  key={permit.id}
                  onClick={() => navigate(`/wip?permit=${permit.id}`)}
                  style={{ display: "grid", gridTemplateColumns: "28px 1fr 100px 80px 70px", gap: 10, alignItems: "center", padding: "10px 12px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{typeInfo.icon}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2C2C2C" }}>{permit.number}</span>
                      <span className="status-pill" style={{ background: getStatusBg(permit.status), color: getStatusColor(permit.status), fontSize: "0.6rem" }}>{permit.status}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#6A6A6A", marginTop: 2 }}>{permit.area} · {permit.contractorName}</div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6A6A6A" }}>
                    <span style={{ marginRight: 4 }}>👷</span>{permit.headcountInside}/{permit.workerCount} inside
                  </div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700 }} className={cdClass}>{cd}</div>
                  <div>
                    <span className="status-pill" style={{ background: "rgba(245,134,52,0.1)", color: "#F58634" }}>
                      {permit.type.substring(0, 4).toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="ptw-card">
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>Permit Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                {statusDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
            {statusDistribution.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ color: "#6A6A6A" }}>{s.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: "#2C2C2C" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div className="ptw-card">
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>NC Trend (7 Weeks)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ncTrend}>
              <defs>
                <linearGradient id="crit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="maj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "0.75rem" }} />
              <Area type="monotone" dataKey="critical" stroke="#DC2626" fill="url(#crit)" strokeWidth={2} name="Critical" />
              <Area type="monotone" dataKey="major" stroke="#D97706" fill="url(#maj)" strokeWidth={2} name="Major" />
              <Area type="monotone" dataKey="minor" stroke="#F58634" fill="transparent" strokeWidth={2} name="Minor" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="ptw-card">
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>Permit Volume by Type (Monthly)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={permitVolume} barSize={10}>
              <XAxis dataKey="month" tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "0.75rem" }} />
              <Bar dataKey="hot" fill="#DC2626" name="Hot Work" radius={[2,2,0,0]} />
              <Bar dataKey="confined" fill="#7C3AED" name="Confined Space" radius={[2,2,0,0]} />
              <Bar dataKey="electrical" fill="#CA8A04" name="Electrical" radius={[2,2,0,0]} />
              <Bar dataKey="height" fill="#16A34A" name="Height Work" radius={[2,2,0,0]} />
              <Bar dataKey="cold" fill="#F58634" name="Cold Work" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="ptw-card">
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>Recent Activity</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {RECENT_EVENTS.map((ev, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "9px 0", borderBottom: i < RECENT_EVENTS.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: 44, fontSize: "0.7rem", color: "#6A6A6A", flexShrink: 0, paddingTop: 1 }}>{ev.time}</div>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: ev.color, marginTop: 5, flexShrink: 0 }} />
              <div style={{ fontSize: "0.8rem", color: "#2C2C2C" }}>{ev.msg}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
