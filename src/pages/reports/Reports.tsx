import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { ncTrend, permitVolume, mockContractors } from "../../data/mockData";

const IS17893_SCORES = [
  { dimension: "Permit Type Coverage", score: 100, max: 100 },
  { dimension: "Risk Assessment Completion", score: 94, max: 100 },
  { dimension: "Approval Compliance", score: 88, max: 100 },
  { dimension: "Gate Compliance", score: 82, max: 100 },
  { dimension: "Audit Compliance", score: 71, max: 100 },
  { dimension: "Closure Compliance", score: 85, max: 100 },
  { dimension: "Record Completeness", score: 96, max: 100 },
];

const overall17893 = Math.round(IS17893_SCORES.reduce((s, d) => s + d.score, 0) / IS17893_SCORES.length);

const hscTrend = [
  { month: "Jan", hold: 3, suspend: 1, cancel: 0 },
  { month: "Feb", hold: 5, suspend: 2, cancel: 1 },
  { month: "Mar", hold: 4, suspend: 1, cancel: 0 },
  { month: "Apr", hold: 7, suspend: 3, cancel: 1 },
  { month: "May", hold: 4, suspend: 2, cancel: 0 },
];

export default function Reports({ viewMode }: { viewMode: "web" | "tablet" }) {
  const isTablet = viewMode === "tablet";

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>Reports & Analytics</h1>
        <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>
          IS 17893 Compliance Report · Contractor Performance · Audit & NC Trends
        </p>
      </div>

      {/* IS 17893 Compliance Score — headline */}
      <div className="ptw-card" style={{ marginBottom: "1.25rem", background: "linear-gradient(135deg, rgba(245,134,52,0.06) 0%, rgba(22,163,74,0.04) 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", fontWeight: 700, color: overall17893 >= 85 ? "#16A34A" : overall17893 >= 70 ? "#D97706" : "#DC2626" }}>
              {overall17893}%
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6A6A6A" }}>IS 17893 Compliance</div>
            <div style={{ fontSize: "0.68rem", color: "#D97706", marginTop: 3 }}>↓ 3pts vs last period</div>
          </div>
          <div style={{ flex: 1, minWidth: 300 }}>
            {IS17893_SCORES.map(d => (
              <div key={d.dimension} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: 3 }}>
                  <span style={{ color: "#6A6A6A" }}>{d.dimension}</span>
                  <span style={{ fontWeight: 700, color: d.score >= 85 ? "#16A34A" : d.score >= 70 ? "#D97706" : "#DC2626" }}>{d.score}%</span>
                </div>
                <div style={{ height: 4, background: "#E5E7EB", borderRadius: 2 }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${d.score}%`, background: d.score >= 85 ? "#16A34A" : d.score >= 70 ? "#D97706" : "#DC2626" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        {/* NC Trend */}
        <div className="ptw-card">
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.9rem" }}>NC Trend Analysis</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ncTrend}>
              <XAxis dataKey="week" tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "0.75rem" }} />
              <Area type="monotone" dataKey="critical" stroke="#DC2626" fill="rgba(220,38,38,0.15)" strokeWidth={2} name="Critical" />
              <Area type="monotone" dataKey="major" stroke="#D97706" fill="rgba(217,119,6,0.1)" strokeWidth={2} name="Major" />
              <Area type="monotone" dataKey="minor" stroke="#F58634" fill="transparent" strokeWidth={2} name="Minor" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* H/S/C Trend */}
        <div className="ptw-card">
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.9rem" }}>H/S/C Events Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={hscTrend}>
              <XAxis dataKey="month" tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "0.75rem" }} />
              <Line type="monotone" dataKey="hold" stroke="#F58634" strokeWidth={2} dot={false} name="Hold" />
              <Line type="monotone" dataKey="suspend" stroke="#D97706" strokeWidth={2} dot={false} name="Suspend" />
              <Line type="monotone" dataKey="cancel" stroke="#DC2626" strokeWidth={2} dot={false} name="Cancel" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Permit volume */}
      <div className="ptw-card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.9rem" }}>Permit Volume by Type (Monthly)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={permitVolume} barSize={12}>
            <XAxis dataKey="month" tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6A6A6A", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "0.75rem" }} />
            <Bar dataKey="hot" fill="#DC2626" name="Hot Work" stackId="a" />
            <Bar dataKey="confined" fill="#7C3AED" name="Confined Space" stackId="a" />
            <Bar dataKey="electrical" fill="#CA8A04" name="Electrical" stackId="a" />
            <Bar dataKey="height" fill="#16A34A" name="Height Work" stackId="a" />
            <Bar dataKey="cold" fill="#F58634" name="Cold Work" stackId="a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Contractor Performance */}
      <div className="ptw-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Contractor Performance Scorecard</h3>
          <button className="btn btn-ghost btn-sm">Export Excel</button>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Contractor</th>
              <th>Total Permits</th>
              <th>NC Rate/100</th>
              <th>Repeat NCs</th>
              <th>Closure Compliance</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            {mockContractors.map(c => {
              const overall = c.scorecard.ncRate <= 5 && c.scorecard.closureCompliance >= 95 ? "green"
                : c.scorecard.ncRate <= 12 && c.scorecard.closureCompliance >= 80 ? "amber"
                : "red";
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: "#2C2C2C" }}>{c.name}</td>
                  <td style={{ color: "#6A6A6A" }}>{c.scorecard.totalPermits}</td>
                  <td style={{ fontWeight: 700, color: c.scorecard.ncRate > 10 ? "#DC2626" : c.scorecard.ncRate > 5 ? "#D97706" : "#16A34A" }}>
                    {c.scorecard.ncRate}%
                  </td>
                  <td style={{ color: c.scorecard.repeatNCs > 0 ? "#D97706" : "#16A34A" }}>{c.scorecard.repeatNCs}</td>
                  <td style={{ color: c.scorecard.closureCompliance >= 95 ? "#16A34A" : c.scorecard.closureCompliance >= 80 ? "#D97706" : "#DC2626" }}>
                    {c.scorecard.closureCompliance}%
                  </td>
                  <td>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: overall === "green" ? "#16A34A" : overall === "amber" ? "#D97706" : "#DC2626" }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
