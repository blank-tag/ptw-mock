import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import PermitList from "./pages/permits/PermitList";
import CreatePermit from "./pages/permits/CreatePermit";
import PermitDetail from "./pages/permits/PermitDetail";
import ApprovalWorkflow from "./pages/approval/ApprovalWorkflow";
import GateEntry from "./pages/gate/GateEntry";
import WorkInProgress from "./pages/wip/WorkInProgress";
import AuditModule from "./pages/audit/AuditModule";
import PermitClosure from "./pages/closure/PermitClosure";
import Reports from "./pages/reports/Reports";
import ContractorPortal from "./pages/contractor/ContractorPortal";
import AdminPanel from "./pages/admin/AdminPanel";
import { StoreProvider, useStore } from "./store/AppStore";
import { useState } from "react";
import type { RoleId } from "./data/roles";

const PAGE_TITLES: Record<string, string> = {
  "/": "Operational Dashboard",
  "/permits": "Permit Register",
  "/permits/new": "Create New Permit",
  "/approval": "Approval Workflow",
  "/gate": "Gate Entry Interface",
  "/wip": "Work in Progress",
  "/audit": "Audit Module — AI Assisted",
  "/closure": "Permit Closure",
  "/reports": "Reports & Analytics",
  "/contractor": "Contractor Portal",
  "/admin": "System Administration",
};

function AppContent() {
  const { role, dispatch } = useStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"web" | "tablet">("web");
  const location = useLocation();
  const navigate = useNavigate();

  const pathKey = location.pathname.startsWith("/permits/") && location.pathname !== "/permits/new"
    ? "/permits/:id"
    : location.pathname;
  const title = PAGE_TITLES[location.pathname] ?? PAGE_TITLES[pathKey] ?? "PTW System";
  const isTablet = viewMode === "tablet";

  function handleRoleChange(id: RoleId) {
    dispatch({ type: "SET_ROLE", id });
    // Navigate to the role's default landing route
    import("./data/roles").then(({ getRoleById }) => {
      navigate(getRoleById(id).defaultRoute);
    });
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#FFFBF8" }}>
      <Sidebar
        collapsed={isTablet ? true : sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
        isTablet={isTablet}
        role={role}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          title={title}
          viewMode={viewMode}
          onToggleView={() => setViewMode(v => v === "web" ? "tablet" : "web")}
          role={role}
          onRoleChange={handleRoleChange}
        />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {isTablet && (
            <div style={{ background: "rgba(245,134,52,0.06)", borderBottom: "1px solid rgba(245,134,52,0.15)", padding: "5px 1.25rem", fontSize: "0.72rem", color: "#F58634", display: "flex", alignItems: "center", gap: 6 }}>
              Tablet View — Touch-optimized for guard tablets, supervisor mobiles, and field use
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard viewMode={viewMode} />} />
            <Route path="/permits" element={<PermitList viewMode={viewMode} />} />
            <Route path="/permits/new" element={<CreatePermit />} />
            <Route path="/permits/:id" element={<PermitDetail />} />
            <Route path="/approval" element={<ApprovalWorkflow viewMode={viewMode} />} />
            <Route path="/gate" element={<GateEntry viewMode={viewMode} />} />
            <Route path="/wip" element={<WorkInProgress viewMode={viewMode} />} />
            <Route path="/audit" element={<AuditModule viewMode={viewMode} />} />
            <Route path="/closure" element={<PermitClosure viewMode={viewMode} />} />
            <Route path="/reports" element={<Reports viewMode={viewMode} />} />
            <Route path="/contractor" element={<ContractorPortal viewMode={viewMode} />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </BrowserRouter>
  );
}
