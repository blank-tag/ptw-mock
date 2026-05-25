import { useState } from "react";
import {
  Plus, Edit2, PauseCircle, PlayCircle, X, CheckCircle, Trash2, AlertTriangle,
  Building2, Users, FileText, GitBranch, Bell, LayoutDashboard, Shield,
  Clock, Activity, TrendingUp, ChevronRight, RefreshCw, Save, ToggleLeft, ToggleRight,
  UserCheck, CalendarRange, ArrowRight, Copy, ExternalLink, Link2, Mail, Video,
} from "lucide-react";
import { useStore } from "../../store/AppStore";
import type { Contractor, Worker, Certification } from "../../types";
import { PERMIT_TYPES, CERT_MAPPING } from "../../data/mockData";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AdminTab = "overview" | "contractors" | "workers" | "permit_setup" | "approval_chains" | "delegation" | "notifications" | "documents" | "system";

interface ValidityRule {
  maxHours: number; soRequired: boolean; gasTestRequired: boolean; minWorkers: number; active: boolean;
}

interface AuditConfig {
  required: boolean; frequencyHours: number; minVideos: number; fallbackAllowed: boolean;
}

interface Delegation {
  id: string;
  fromName: string; fromRole: string;
  toName: string; toRole: string;
  permitTypes: string[]; fromDate: string; toDate: string; reason: string;
}

interface InviteModal {
  contractorId: string; contractorName: string;
  token: string; expiry: string;
  allowWorkerAdd: boolean; allowDocUpload: boolean; copied: boolean;
}

interface NotifEvent {
  id: string; module: string; event: string; email: boolean; sms: boolean; inApp: boolean;
}

interface ContractAgreement {
  id: string; contractorId: string; refNo: string; workType: string;
  quota: number; fromDate: string; toDate: string; status: "Active" | "Expired" | "Renewing";
}

interface CompanyDocument {
  id: string; contractorId: string; type: string; docNo: string; expiry: string;
  status: "Valid" | "Expiring" | "Expired";
}

interface PPEItem {
  id: string; name: string; category: string; stock: number; issued: number; unit: string; consumable: boolean;
}

interface SOPDoc {
  id: string; title: string; permitType: string; version: string; updatedDate: string; fileSize: string;
}

interface SystemSetting {
  permitNumberFormat: string; dataRetentionYears: number; escalationGraceMins: number;
  auditGraceHours: number; permitExpiryWarnHours: number; autoCloseAfterDays: number;
}

interface ReportSchedule {
  id: string; name: string; frequency: "Daily" | "Weekly" | "Monthly";
  format: "PDF" | "Excel" | "Both"; recipients: string; lastRun: string; active: boolean;
}

interface CustomPermitType {
  id: string; label: string; icon: string; maxHours: number; soRequired: boolean; active: boolean;
}

// ─── STATIC DATA ──────────────────────────────────────────────────────────────

const DEFAULT_VALIDITY: Record<string, ValidityRule> = {
  "Hot Work":      { maxHours: 8,   soRequired: true,  gasTestRequired: true,  minWorkers: 2, active: true },
  "Cold Work":     { maxHours: 168, soRequired: false, gasTestRequired: false, minWorkers: 1, active: true },
  "Confined Space":{ maxHours: 8,   soRequired: true,  gasTestRequired: true,  minWorkers: 3, active: true },
  "Excavation":    { maxHours: 168, soRequired: false, gasTestRequired: false, minWorkers: 2, active: true },
  "Electrical":    { maxHours: 24,  soRequired: true,  gasTestRequired: false, minWorkers: 2, active: true },
  "Height Work":   { maxHours: 24,  soRequired: false, gasTestRequired: false, minWorkers: 2, active: true },
  "Radiography":   { maxHours: 8,   soRequired: true,  gasTestRequired: true,  minWorkers: 3, active: true },
};

const DEFAULT_AUDIT_CONFIG: Record<string, AuditConfig> = {
  "Hot Work":      { required: true,  frequencyHours: 2, minVideos: 2, fallbackAllowed: true  },
  "Cold Work":     { required: false, frequencyHours: 8, minVideos: 1, fallbackAllowed: true  },
  "Confined Space":{ required: true,  frequencyHours: 1, minVideos: 3, fallbackAllowed: false },
  "Excavation":    { required: true,  frequencyHours: 4, minVideos: 1, fallbackAllowed: true  },
  "Electrical":    { required: true,  frequencyHours: 2, minVideos: 2, fallbackAllowed: false },
  "Height Work":   { required: true,  frequencyHours: 4, minVideos: 1, fallbackAllowed: true  },
  "Radiography":   { required: true,  frequencyHours: 1, minVideos: 3, fallbackAllowed: false },
};

const ALL_CERTS = [
  "Welding Certificate", "Fire Safety Training", "Medical Fitness", "PTW Procedure Training",
  "Basic Safety Training", "Confined Space Entry", "Gas Testing", "Rescue Training",
  "Excavation Safety", "Electrical Competency", "Isolation Training", "Working at Height",
  "Harness Inspection", "Radiation Safety", "Radiography Operator Cert",
];

const DEFAULT_CHAINS: Record<string, { role: string; label: string; color: string }[]> = {
  "Hot Work":      [{ role: "area_incharge", label: "Area In-Charge", color: "#ffc46c" }, { role: "safety_officer", label: "Safety Officer", color: "#6cffa8" }, { role: "approver", label: "Approver", color: "#ffc46c" }],
  "Cold Work":     [{ role: "area_incharge", label: "Area In-Charge", color: "#ffc46c" }, { role: "approver", label: "Approver", color: "#ffc46c" }],
  "Confined Space":[{ role: "area_incharge", label: "Area In-Charge", color: "#ffc46c" }, { role: "safety_officer", label: "Safety Officer", color: "#6cffa8" }, { role: "approver", label: "Approver", color: "#ffc46c" }, { role: "factory_admin", label: "Factory Admin", color: "#ff6c8c" }],
  "Excavation":    [{ role: "area_incharge", label: "Area In-Charge", color: "#ffc46c" }, { role: "approver", label: "Approver", color: "#ffc46c" }],
  "Electrical":    [{ role: "area_incharge", label: "Area In-Charge", color: "#ffc46c" }, { role: "safety_officer", label: "Safety Officer", color: "#6cffa8" }, { role: "approver", label: "Approver", color: "#ffc46c" }],
  "Height Work":   [{ role: "area_incharge", label: "Area In-Charge", color: "#ffc46c" }, { role: "approver", label: "Approver", color: "#ffc46c" }],
  "Radiography":   [{ role: "area_incharge", label: "Area In-Charge", color: "#ffc46c" }, { role: "safety_officer", label: "Safety Officer", color: "#6cffa8" }, { role: "approver", label: "Approver", color: "#ffc46c" }, { role: "factory_admin", label: "Factory Admin", color: "#ff6c8c" }],
};

const INTERNAL_USERS = [
  { name: "Arun Kumar",         role: "Factory Admin",  dept: "Administration", email: "arun.k@factory.in",    status: "Active" },
  { name: "Priya Nair",         role: "Approver",       dept: "Engineering",    email: "priya.n@factory.in",   status: "Active" },
  { name: "Sunita Reddy",       role: "Safety Officer", dept: "HSE",            email: "sunita.r@factory.in",  status: "Active" },
  { name: "Mohammed Al-Rashid", role: "Area In-Charge", dept: "Operations",     email: "m.alrashid@factory.in",status: "Active" },
  { name: "Vikram Patel",       role: "Auditor",        dept: "HSE",            email: "vikram.p@factory.in",  status: "Active" },
  { name: "Rahul Sharma",       role: "Requester",      dept: "Maintenance",    email: "rahul.s@factory.in",   status: "Active" },
  { name: "Ramesh Kumar",       role: "Gate Guard",     dept: "Security",       email: "ramesh.k@factory.in",  status: "Active" },
];

const MOCK_DELEGATIONS: Delegation[] = [
  { id: "DEL001", fromName: "Priya Nair", fromRole: "Approver", toName: "Mohammed Al-Rashid", toRole: "Acting Approver", permitTypes: ["Cold Work", "Height Work"], fromDate: "2026-05-22", toDate: "2026-05-30", reason: "Annual leave" },
  { id: "DEL002", fromName: "Sunita Reddy", fromRole: "Safety Officer", toName: "Vikram Patel", toRole: "Acting SO", permitTypes: ["Hot Work", "Confined Space", "Radiography"], fromDate: "2026-05-24", toDate: "2026-05-26", reason: "Off-site training" },
];

const MODULE_COLORS: Record<string, string> = {
  Permit: "#6c8cff", Approval: "#ffc46c", Gate: "#16A34A",
  WIP: "#F58634", Audit: "#c46cff", Contractor: "#6cffa8", Closure: "#ff6c8c",
};

const MOCK_AGREEMENTS: ContractAgreement[] = [
  { id: "AGR001", contractorId: "C001", refNo: "AGR-2024-001", workType: "Hot Work & Welding", quota: 15, fromDate: "2024-01-01", toDate: "2026-12-31", status: "Active" },
  { id: "AGR002", contractorId: "C001", refNo: "AGR-2025-003", workType: "Electrical Maintenance", quota: 8, fromDate: "2025-01-01", toDate: "2025-12-31", status: "Expired" },
  { id: "AGR003", contractorId: "C002", refNo: "AGR-2025-007", workType: "Civil & Excavation", quota: 20, fromDate: "2025-03-01", toDate: "2026-02-28", status: "Active" },
  { id: "AGR004", contractorId: "C003", refNo: "AGR-2026-001", workType: "General Maintenance", quota: 10, fromDate: "2026-01-01", toDate: "2026-12-31", status: "Active" },
  { id: "AGR005", contractorId: "C004", refNo: "AGR-2026-002", workType: "Radiography & NDT", quota: 6, fromDate: "2026-02-01", toDate: "2026-07-31", status: "Renewing" },
];

const MOCK_COMPANY_DOCS: CompanyDocument[] = [
  { id: "DOC001", contractorId: "C001", type: "Trade License", docNo: "TL-2024-0921", expiry: "2026-09-30", status: "Valid" },
  { id: "DOC002", contractorId: "C001", type: "GST Certificate", docNo: "GST-29AABCT3518Q1ZV", expiry: "2026-06-10", status: "Expiring" },
  { id: "DOC003", contractorId: "C001", type: "Liability Insurance", docNo: "INS-2024-9821", expiry: "2025-12-31", status: "Expired" },
  { id: "DOC004", contractorId: "C002", type: "Trade License", docNo: "TL-2025-0456", expiry: "2027-01-15", status: "Valid" },
  { id: "DOC005", contractorId: "C002", type: "GST Certificate", docNo: "GST-27AABCB1234Z1ZX", expiry: "2026-12-31", status: "Valid" },
  { id: "DOC006", contractorId: "C002", type: "WCP Certificate", docNo: "WCP-2025-7761", expiry: "2026-06-20", status: "Expiring" },
  { id: "DOC007", contractorId: "C003", type: "Trade License", docNo: "TL-2025-1102", expiry: "2026-11-30", status: "Valid" },
  { id: "DOC008", contractorId: "C003", type: "ESIC Registration", docNo: "ESIC-33-44-0099", expiry: "2027-03-31", status: "Valid" },
  { id: "DOC009", contractorId: "C003", type: "Liability Insurance", docNo: "INS-2025-3312", expiry: "2026-08-14", status: "Valid" },
];

const MOCK_PPE: PPEItem[] = [
  { id: "PPE001", name: "Safety Helmet", category: "Head Protection", stock: 50, issued: 28, unit: "Nos", consumable: false },
  { id: "PPE002", name: "Safety Harness", category: "Fall Protection", stock: 20, issued: 12, unit: "Nos", consumable: false },
  { id: "PPE003", name: "Safety Shoes", category: "Foot Protection", stock: 40, issued: 30, unit: "Pairs", consumable: false },
  { id: "PPE004", name: "FR Coveralls", category: "Body Protection", stock: 30, issued: 18, unit: "Nos", consumable: false },
  { id: "PPE005", name: "Safety Goggles", category: "Eye Protection", stock: 60, issued: 35, unit: "Nos", consumable: false },
  { id: "PPE006", name: "N95 Respirator", category: "Respiratory", stock: 200, issued: 145, unit: "Nos", consumable: true },
  { id: "PPE007", name: "Chemical Gloves", category: "Hand Protection", stock: 100, issued: 72, unit: "Pairs", consumable: true },
  { id: "PPE008", name: "Ear Plugs", category: "Hearing Protection", stock: 500, issued: 380, unit: "Pairs", consumable: true },
];

const MOCK_SOPS: SOPDoc[] = [
  { id: "SOP001", title: "Hot Work Permit Procedure", permitType: "Hot Work", version: "v3.1", updatedDate: "2026-03-15", fileSize: "2.4 MB" },
  { id: "SOP002", title: "Confined Space Entry Protocol", permitType: "Confined Space", version: "v2.5", updatedDate: "2026-01-20", fileSize: "3.1 MB" },
  { id: "SOP003", title: "Electrical Isolation Procedure", permitType: "Electrical", version: "v4.0", updatedDate: "2026-04-01", fileSize: "1.8 MB" },
  { id: "SOP004", title: "Height Work Safety Guidelines", permitType: "Height Work", version: "v2.2", updatedDate: "2025-11-10", fileSize: "2.9 MB" },
  { id: "SOP005", title: "Excavation Safety Protocol", permitType: "Excavation", version: "v1.9", updatedDate: "2025-12-05", fileSize: "1.5 MB" },
  { id: "SOP006", title: "Radiography Safety Manual", permitType: "Radiography", version: "v3.0", updatedDate: "2026-02-28", fileSize: "4.2 MB" },
  { id: "SOP007", title: "General Site Safety Induction", permitType: "All Types", version: "v5.1", updatedDate: "2026-04-10", fileSize: "5.6 MB" },
  { id: "SOP008", title: "Emergency Response Plan", permitType: "All Types", version: "v2.8", updatedDate: "2026-03-01", fileSize: "3.8 MB" },
];

const DEFAULT_SYSTEM_SETTINGS: SystemSetting = {
  permitNumberFormat: "TYPE-YEAR-SEQ",
  dataRetentionYears: 5,
  escalationGraceMins: 30,
  auditGraceHours: 2,
  permitExpiryWarnHours: 2,
  autoCloseAfterDays: 7,
};

const MOCK_REPORT_SCHEDULES: ReportSchedule[] = [
  { id: "RS001", name: "Daily Permit Activity Report", frequency: "Daily", format: "PDF", recipients: "arun.k@factory.in, sunita.r@factory.in", lastRun: "2026-05-24", active: true },
  { id: "RS002", name: "Weekly Contractor Performance", frequency: "Weekly", format: "Excel", recipients: "arun.k@factory.in", lastRun: "2026-05-18", active: true },
  { id: "RS003", name: "Monthly IS 17893 Compliance Report", frequency: "Monthly", format: "Both", recipients: "arun.k@factory.in, vikram.p@factory.in", lastRun: "2026-04-30", active: true },
  { id: "RS004", name: "Management Summary Report", frequency: "Monthly", format: "PDF", recipients: "management@factory.in", lastRun: "2026-04-30", active: false },
];

const NOTIFICATION_EVENTS_DEFAULT: NotifEvent[] = [
  { id: "n01", module: "Permit",     event: "Permit submitted for approval",           email: true,  sms: false, inApp: true  },
  { id: "n02", module: "Permit",     event: "Permit approved — work may commence",      email: true,  sms: true,  inApp: true  },
  { id: "n03", module: "Permit",     event: "Permit rejected or returned to requester", email: true,  sms: false, inApp: true  },
  { id: "n04", module: "Permit",     event: "Permit expiring in < 2 hours",             email: false, sms: true,  inApp: true  },
  { id: "n05", module: "Permit",     event: "Permit expired with workers still inside", email: true,  sms: true,  inApp: true  },
  { id: "n06", module: "Approval",   event: "SO safety review required (high-risk)",    email: true,  sms: true,  inApp: true  },
  { id: "n07", module: "Approval",   event: "Approval pending beyond configured limit", email: true,  sms: false, inApp: true  },
  { id: "n08", module: "Approval",   event: "Approval escalated to alternate",          email: true,  sms: true,  inApp: true  },
  { id: "n09", module: "Gate",       event: "Worker entry denied — compliance failure", email: false, sms: false, inApp: true  },
  { id: "n10", module: "Gate",       event: "Blacklisted worker entry attempted",       email: true,  sms: true,  inApp: true  },
  { id: "n11", module: "WIP",        event: "Hold activated on a permit",               email: false, sms: true,  inApp: true  },
  { id: "n12", module: "WIP",        event: "Suspend activated on a permit",            email: true,  sms: true,  inApp: true  },
  { id: "n13", module: "WIP",        event: "Zero headcount — permit not closed",       email: true,  sms: false, inApp: true  },
  { id: "n14", module: "WIP",        event: "Revalidation overdue",                     email: false, sms: true,  inApp: true  },
  { id: "n15", module: "Audit",      event: "Scheduled audit overdue",                  email: true,  sms: false, inApp: true  },
  { id: "n16", module: "Audit",      event: "Critical NC raised",                       email: true,  sms: true,  inApp: true  },
  { id: "n17", module: "Audit",      event: "Major NC raised",                          email: true,  sms: false, inApp: true  },
  { id: "n18", module: "Audit",      event: "NC not closed within SLA",                 email: true,  sms: true,  inApp: true  },
  { id: "n19", module: "Contractor", event: "Worker certification expiring < 30 days",  email: true,  sms: false, inApp: true  },
  { id: "n20", module: "Contractor", event: "Worker certification expired",             email: true,  sms: true,  inApp: true  },
  { id: "n21", module: "Contractor", event: "Company document expiring < 14 days",      email: true,  sms: false, inApp: false },
  { id: "n22", module: "Contractor", event: "New worker registered via invite link",    email: true,  sms: false, inApp: true  },
  { id: "n23", module: "Closure",    event: "Closure submitted — awaiting verification",email: true,  sms: false, inApp: true  },
  { id: "n24", module: "Closure",    event: "Permit closure certificate generated",     email: true,  sms: false, inApp: true  },
];

// ─── SHARED UTILS ─────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="ptw-card" style={{ padding: "1.1rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6A6A6A", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ color, opacity: 0.7 }}>{icon}</div>
      </div>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "#6A6A6A", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: value ? "#16A34A" : "#9CA3AF" }}>
      {value ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
    </button>
  );
}

function generateInviteToken(contractorId: string): string {
  return btoa(`${contractorId}:${Date.now()}`).replace(/[+=\/]/g, "").slice(0, 24);
}

// ─── CONTRACTOR FORMS ─────────────────────────────────────────────────────────

function AddContractorForm({ onSave, onCancel }: { onSave: (c: Contractor) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [reg, setReg] = useState("");
  const valid = name.trim().length > 2;
  function submit() {
    const id = `C${String(Date.now()).slice(-4)}`;
    const c: Contractor = {
      id, name: name.trim(), status: "Active",
      scorecard: { totalPermits: 0, totalNCs: 0, ncRate: 0, repeatNCs: 0, closureCompliance: 100 },
      is17893Status: { "Hot Work": "amber", "Cold Work": "amber", "Confined Space": "amber", "Excavation": "amber", "Electrical": "amber", "Height Work": "amber", "Radiography": "amber" },
    };
    void contact; void reg;
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
          <input value={reg} onChange={e => setReg(e.target.value)} placeholder="GST / Trade Lic No." />
        </div>
        <div>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Contact Person</label>
          <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Supervisor / Manager name" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary btn-sm" disabled={!valid} onClick={submit} style={{ opacity: valid ? 1 : 0.4 }}><CheckCircle size={13} /> Save Contractor</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={13} /> Cancel</button>
      </div>
    </div>
  );
}

function AddWorkerForm({ contractors, onSave, onCancel }: { contractors: Contractor[]; onSave: (w: Worker) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"Worker" | "Supervisor">("Worker");
  const [contractorId, setContractorId] = useState(contractors[0]?.id || "");
  const [certs, setCerts] = useState<{ name: string; expiry: string }[]>([{ name: "", expiry: "" }]);
  const valid = name.trim().length > 2 && contractorId;
  function addCert() { setCerts(c => [...c, { name: "", expiry: "" }]); }
  function removeCert(i: number) { setCerts(c => c.filter((_, idx) => idx !== i)); }
  function updateCert(i: number, field: "name" | "expiry", val: string) { setCerts(c => c.map((x, idx) => idx === i ? { ...x, [field]: val } : x)); }
  function getCertStatus(expiry: string): "Valid" | "Expiring" | "Expired" {
    if (!expiry) return "Valid";
    const diff = (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    if (diff < 0) return "Expired"; if (diff < 3) return "Expiring"; return "Valid";
  }
  function submit() {
    const initials = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const certifications: Certification[] = certs.filter(c => c.name.trim()).map((c, i) => ({
      id: `cert-${Date.now()}-${i}`, name: c.name.trim(),
      expiryDate: c.expiry || new Date(Date.now() + 365 * 24 * 3600000).toISOString().slice(0, 10),
      status: getCertStatus(c.expiry),
    }));
    const w: Worker = { id: `W${String(Date.now()).slice(-4)}`, name: name.trim(), role, contractorId, certifications, status: "Active", photo: initials };
    onSave(w);
  }
  const suggestedCerts = Array.from(new Set(Object.values(CERT_MAPPING).flat()));
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
          <select value={role} onChange={e => setRole(e.target.value as "Worker" | "Supervisor")}>
            <option value="Worker">Worker</option>
            <option value="Supervisor">Supervisor</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Contractor *</label>
          <select value={contractorId} onChange={e => setContractorId(e.target.value)}>
            {contractors.filter(c => c.status === "Active").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600 }}>Certifications</label>
          <button className="btn btn-ghost btn-sm" onClick={addCert} style={{ fontSize: "0.68rem" }}><Plus size={11} /> Add Cert</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {certs.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 160px 28px", gap: 6, alignItems: "center" }}>
              <select value={c.name} onChange={e => updateCert(i, "name", e.target.value)}>
                <option value="">Select certification…</option>
                {suggestedCerts.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" value={c.expiry} onChange={e => updateCert(i, "expiry", e.target.value)} />
              <button onClick={() => removeCert(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 4 }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-success btn-sm" disabled={!valid} onClick={submit} style={{ opacity: valid ? 1 : 0.4 }}><CheckCircle size={13} /> Save Worker</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={13} /> Cancel</button>
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { state, dispatch } = useStore();
  const activeContractors = state.contractors.filter(c => c.status === "Active").length;
  const activeWorkers = state.workers.filter(w => w.status === "Active").length;
  const certIssues = state.workers.reduce((sum, w) => sum + w.certifications.filter(c => c.status === "Expired" || c.status === "Expiring").length, 0);
  const activePermits = state.permits.filter(p => ["Active", "Approved"].includes(p.status)).length;
  const pendingApprovals = state.permits.filter(p => ["Pending", "SO Review"].includes(p.status)).length;
  const nonCompliantContractors = state.contractors.filter(c => Object.values(c.is17893Status).some(v => v === "red")).length;

  const RECENT_EVENTS = [
    { time: "10:32", text: "PTW-2024-031 issued — Confined Space, Apex Industrial", type: "permit" },
    { time: "09:55", text: "Worker cert expired — Suresh Rao (Confined Space Entry)", type: "alert" },
    { time: "09:21", text: "PTW-2024-030 closed by John Smith (Contractor Supervisor)", type: "closure" },
    { time: "08:47", text: "Temp delegation activated — Vikram Patel covering Safety Officer", type: "delegation" },
    { time: "Yesterday", text: "Contractor 'BuildRight Infra' suspended — NC threshold exceeded", type: "alert" },
  ];
  const EVENT_COLORS: Record<string, string> = { permit: "#F58634", alert: "#DC2626", closure: "#16A34A", delegation: "#6c8cff" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}>
        <KpiCard label="Active Contractors" value={activeContractors} sub={`${state.contractors.length - activeContractors} suspended`} color="#F58634" icon={<Building2 size={16} />} />
        <KpiCard label="Active Workers" value={activeWorkers} sub={`${state.workers.length} total`} color="#6c8cff" icon={<Users size={16} />} />
        <KpiCard label="Active Permits" value={activePermits} sub="today" color="#16A34A" icon={<FileText size={16} />} />
        <KpiCard label="Pending Approval" value={pendingApprovals} sub="awaiting action" color={pendingApprovals > 3 ? "#DC2626" : "#D97706"} icon={<Clock size={16} />} />
        <KpiCard label="Cert Issues" value={certIssues} sub="expired or expiring" color={certIssues > 0 ? "#DC2626" : "#16A34A"} icon={<AlertTriangle size={16} />} />
        <KpiCard label="Non-Compliant" value={nonCompliantContractors} sub="contractors" color={nonCompliantContractors > 0 ? "#DC2626" : "#16A34A"} icon={<Shield size={16} />} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="ptw-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <TrendingUp size={15} color="#F58634" />
            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2C2C2C" }}>IS 17893 Compliance by Permit Type</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PERMIT_TYPES.map(pt => {
              const total = state.contractors.length;
              const compliant = state.contractors.filter(c => c.is17893Status[pt.value] === "green").length;
              const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
              return (
                <div key={pt.value} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "0.78rem", color: "#2C2C2C", width: 110, flexShrink: 0 }}>{pt.icon} {pt.value}</span>
                  <div style={{ flex: 1, height: 7, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: pct >= 80 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626", width: 36, textAlign: "right" }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="ptw-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <Activity size={15} color="#F58634" />
            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2C2C2C" }}>Recent System Activity</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RECENT_EVENTS.map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: EVENT_COLORS[ev.type], marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: "0.78rem", color: "#2C2C2C", lineHeight: 1.4 }}>{ev.text}</div>
                <span style={{ fontSize: "0.65rem", color: "#9CA3AF", flexShrink: 0 }}>{ev.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "RESET" })} style={{ color: "#DC2626", border: "1px solid rgba(220,38,38,0.3)", fontSize: "0.7rem" }}>
          <RefreshCw size={11} /> Reset to Demo Data
        </button>
      </div>
    </div>
  );
}

// ─── CONTRACTORS TAB ──────────────────────────────────────────────────────────

function ContractorsTab() {
  const { state, dispatch } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [inviteModal, setInviteModal] = useState<InviteModal | null>(null);

  function workerCount(cId: string) { return state.workers.filter(w => w.contractorId === cId).length; }
  function permitCount(cId: string) { return state.permits.filter(p => p.contractorId === cId).length; }

  function openInviteModal(c: Contractor) {
    const token = generateInviteToken(c.id);
    const expiry = new Date(Date.now() + 7 * 24 * 3600000).toISOString().slice(0, 10);
    setInviteModal({ contractorId: c.id, contractorName: c.name, token, expiry, allowWorkerAdd: true, allowDocUpload: false, copied: false });
  }

  function copyUrl() {
    if (!inviteModal) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteModal.token}`);
    setInviteModal(m => m ? { ...m, copied: true } : null);
    setTimeout(() => setInviteModal(m => m ? { ...m, copied: false } : null), 2000);
  }

  return (
    <>
      {/* Invite Modal */}
      {inviteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "1.75rem", width: 540, maxWidth: "92vw", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(245,134,52,0.1)", border: "1px solid rgba(245,134,52,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F58634" }}>
                  <Link2 size={17} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2C2C2C" }}>Contractor Invite Link</div>
                  <div style={{ fontSize: "0.7rem", color: "#6A6A6A" }}>{inviteModal.contractorName}</div>
                </div>
              </div>
              <button onClick={() => setInviteModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6A6A6A", padding: 4 }}><X size={18} /></button>
            </div>

            {/* URL Box */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 6 }}>Invitation URL</label>
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ flex: 1, fontSize: "0.72rem", color: "#2C2C2C", wordBreak: "break-all", fontFamily: "monospace" }}>
                  {window.location.origin}/invite/{inviteModal.token}
                </code>
                <button onClick={copyUrl} title="Copy link" style={{ background: inviteModal.copied ? "rgba(22,163,74,0.1)" : "rgba(245,134,52,0.1)", border: `1px solid ${inviteModal.copied ? "rgba(22,163,74,0.3)" : "rgba(245,134,52,0.3)"}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 700, color: inviteModal.copied ? "#16A34A" : "#F58634" }}>
                  {inviteModal.copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            </div>

            {/* Settings row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Link Expires</label>
                <input type="date" value={inviteModal.expiry} onChange={e => setInviteModal(m => m ? { ...m, expiry: e.target.value } : null)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600 }}>Permissions</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Toggle value={inviteModal.allowWorkerAdd} onChange={v => setInviteModal(m => m ? { ...m, allowWorkerAdd: v } : null)} />
                  <span style={{ fontSize: "0.75rem", color: "#2C2C2C" }}>Allow worker self-registration</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Toggle value={inviteModal.allowDocUpload} onChange={v => setInviteModal(m => m ? { ...m, allowDocUpload: v } : null)} />
                  <span style={{ fontSize: "0.75rem", color: "#2C2C2C" }}>Allow document upload</span>
                </div>
              </div>
            </div>

            {/* Info banner */}
            <div style={{ background: "rgba(108,140,255,0.06)", border: "1px solid rgba(108,140,255,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: "1.25rem", fontSize: "0.72rem", color: "#6A6A6A", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Mail size={13} style={{ color: "#6c8cff", marginTop: 1, flexShrink: 0 }} />
              <span>Share this link with <strong style={{ color: "#2C2C2C" }}>{inviteModal.contractorName}</strong> — they can open it without logging in to register their workers and submit certifications.</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => window.open(`/invite/${inviteModal.token}`, "_blank")} style={{ gap: 5 }}>
                <ExternalLink size={12} /> Open Portal
              </button>
              <a href={`mailto:?subject=PTW Worker Registration Portal&body=You have been invited to register workers for ${inviteModal.contractorName}. Please use this link (expires ${inviteModal.expiry}):%0A%0A${window.location.origin}/invite/${inviteModal.token}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, background: "#F9FAFB", border: "1px solid #E5E7EB", fontSize: "0.78rem", fontWeight: 600, color: "#6A6A6A", textDecoration: "none" }}>
                <Mail size={12} /> Send Email
              </a>
              <button className="btn btn-ghost btn-sm" onClick={() => setInviteModal(null)} style={{ marginLeft: "auto" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showAdd ? (
        <AddContractorForm onSave={c => { dispatch({ type: "ADD_CONTRACTOR", payload: c }); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add Contractor</button>
        </div>
      )}

      <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table-base">
          <thead>
            <tr><th>ID</th><th>Company</th><th>Status</th><th>Workers</th><th>Permits</th><th>NC Rate</th><th>Closure %</th><th>IS 17893</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {state.contractors.map(c => {
              const redCount = Object.values(c.is17893Status).filter(v => v === "red").length;
              const amberCount = Object.values(c.is17893Status).filter(v => v === "amber").length;
              return (
                <tr key={c.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#6A6A6A" }}>{c.id}</td>
                  <td>
                    {editingId === c.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: "3px 8px", fontSize: "0.8rem" }} />
                        <button className="btn btn-success btn-sm" onClick={() => { dispatch({ type: "UPDATE_CONTRACTOR", id: c.id, changes: { name: editName } }); setEditingId(null); }}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{c.name}</span>
                    )}
                  </td>
                  <td><span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: c.status === "Active" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: c.status === "Active" ? "#16A34A" : "#DC2626", border: `1px solid ${c.status === "Active" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>{c.status}</span></td>
                  <td style={{ fontWeight: 600 }}>{workerCount(c.id)}</td>
                  <td style={{ fontWeight: 600 }}>{permitCount(c.id)}</td>
                  <td style={{ fontWeight: 700, color: c.scorecard.ncRate > 10 ? "#DC2626" : "#16A34A" }}>{c.scorecard.ncRate}%</td>
                  <td style={{ fontWeight: 700, color: c.scorecard.closureCompliance >= 90 ? "#16A34A" : "#D97706" }}>{c.scorecard.closureCompliance}%</td>
                  <td>
                    <div style={{ display: "flex", gap: 3 }}>
                      {redCount > 0 && <span style={{ fontSize: "0.65rem", background: "rgba(220,38,38,0.1)", color: "#DC2626", borderRadius: 3, padding: "1px 5px", border: "1px solid rgba(220,38,38,0.2)" }}>{redCount} Non-Compliant</span>}
                      {amberCount > 0 && <span style={{ fontSize: "0.65rem", background: "rgba(217,119,6,0.1)", color: "#D97706", borderRadius: 3, padding: "1px 5px", border: "1px solid rgba(217,119,6,0.2)" }}>{amberCount} Expiring</span>}
                      {redCount === 0 && amberCount === 0 && <span style={{ fontSize: "0.65rem", color: "#16A34A" }}>All Green</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openInviteModal(c)} style={{ padding: "3px 7px", color: "#6c8cff" }} title="Generate invite link">
                        <Link2 size={12} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(c.id); setEditName(c.name); }} style={{ padding: "3px 7px" }}><Edit2 size={12} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "UPDATE_CONTRACTOR", id: c.id, changes: { status: c.status === "Active" ? "Suspended" : "Active" } })} style={{ padding: "3px 7px", color: c.status === "Active" ? "#D97706" : "#16A34A" }}>
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
  );
}

// ─── WORKERS TAB ──────────────────────────────────────────────────────────────

function WorkersTab() {
  const { state, dispatch } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [filterContractor, setFilterContractor] = useState("all");
  const [showFlagsOnly, setShowFlagsOnly] = useState(false);

  // detect workers with same name appearing in 2+ contractors (multi-company flag §1.10)
  const nameCounts: Record<string, string[]> = {};
  state.workers.forEach(w => {
    const key = w.name.toLowerCase().trim();
    if (!nameCounts[key]) nameCounts[key] = [];
    nameCounts[key].push(w.contractorId);
  });
  const flaggedNames = new Set(Object.entries(nameCounts).filter(([, ids]) => new Set(ids).size > 1).map(([name]) => name));

  const filteredWorkers = state.workers.filter(w => {
    const contractorMatch = filterContractor === "all" || w.contractorId === filterContractor;
    const flagMatch = !showFlagsOnly || flaggedNames.has(w.name.toLowerCase().trim());
    return contractorMatch && flagMatch;
  });
  return (
    <>
      {showAdd ? (
        <AddWorkerForm contractors={state.contractors} onSave={w => { dispatch({ type: "ADD_WORKER", payload: w }); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select value={filterContractor} onChange={e => setFilterContractor(e.target.value)} style={{ width: "auto", minWidth: 220 }}>
              <option value="all">All Contractors</option>
              {state.contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {flaggedNames.size > 0 && (
              <button
                onClick={() => setShowFlagsOnly(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: `1px solid ${showFlagsOnly ? "rgba(220,38,38,0.4)" : "rgba(220,38,38,0.2)"}`, background: showFlagsOnly ? "rgba(220,38,38,0.1)" : "transparent", color: "#DC2626", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
              >
                <AlertTriangle size={11} /> {flaggedNames.size} Multi-Company Flag{flaggedNames.size > 1 ? "s" : ""}
              </button>
            )}
          </div>
          <button className="btn btn-success btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add Worker</button>
        </div>
      )}
      <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table-base">
          <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Contractor</th><th>Certifications</th><th>Status</th><th>Actions</th></tr></thead>
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
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(245,134,52,0.15)", border: "1px solid rgba(245,134,52,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#F58634", flexShrink: 0 }}>{w.photo}</div>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{w.name}</span>
                      {flaggedNames.has(w.name.toLowerCase().trim()) && (
                        <span title="Worker appears in multiple contractors" style={{ fontSize: "0.6rem", background: "rgba(220,38,38,0.1)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>Multi-Co</span>
                      )}
                    </div>
                  </td>
                  <td><span style={{ fontSize: "0.72rem", fontWeight: 600, color: w.role === "Supervisor" ? "#D97706" : "#6A6A6A" }}>{w.role}</span></td>
                  <td style={{ fontSize: "0.8rem", color: "#6A6A6A" }}>{contractor?.name || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <span style={{ fontSize: "0.68rem", color: "#16A34A" }}>{w.certifications.length - expiredCount - expiringCount} valid</span>
                      {expiringCount > 0 && <span style={{ fontSize: "0.68rem", color: "#D97706" }}>{expiringCount} expiring</span>}
                      {expiredCount > 0 && <span style={{ fontSize: "0.68rem", color: "#DC2626", display: "flex", alignItems: "center", gap: 2 }}><AlertTriangle size={10} />{expiredCount} expired</span>}
                    </div>
                  </td>
                  <td><span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: w.status === "Active" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: w.status === "Active" ? "#16A34A" : "#DC2626", border: `1px solid ${w.status === "Active" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>{w.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "UPDATE_WORKER", id: w.id, changes: { status: w.status === "Active" ? "Suspended" : "Active" } })} style={{ padding: "3px 7px", color: w.status === "Active" ? "#D97706" : "#16A34A" }} title={w.status === "Active" ? "Suspend" : "Reinstate"}>
                        {w.status === "Active" ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
                      </button>
                      {w.status !== "Blacklisted" && (
                        <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "UPDATE_WORKER", id: w.id, changes: { status: "Blacklisted" } })} style={{ padding: "3px 7px", color: "#DC2626" }} title="Blacklist worker">
                          <AlertTriangle size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── PERMIT SETUP TAB ─────────────────────────────────────────────────────────

function PermitSetupTab() {
  const [sub, setSub] = useState<"validity" | "certs" | "audit" | "custom">("validity");
  const [rules, setRules] = useState<Record<string, ValidityRule>>({ ...DEFAULT_VALIDITY });
  const [certMap, setCertMap] = useState<Record<string, string[]>>({ ...CERT_MAPPING });
  const [auditConfig, setAuditConfig] = useState<Record<string, AuditConfig>>({ ...DEFAULT_AUDIT_CONFIG });
  const [ptwMandatory, setPtwMandatory] = useState(true);
  const [editType, setEditType] = useState<string | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editMin, setEditMin] = useState("");
  const [editAuditType, setEditAuditType] = useState<string | null>(null);
  const [editFreq, setEditFreq] = useState("");
  const [editVids, setEditVids] = useState("");
  const [saved, setSaved] = useState(false);
  const [customTypes, setCustomTypes] = useState<CustomPermitType[]>([
    { id: "CT001", label: "LOTO Work", icon: "🔒", maxHours: 24, soRequired: true, active: true },
    { id: "CT002", label: "Chemical Handling", icon: "⚗️", maxHours: 8, soRequired: true, active: true },
  ]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomLabel, setNewCustomLabel] = useState("");
  const [newCustomIcon, setNewCustomIcon] = useState("📋");
  const [newCustomHours, setNewCustomHours] = useState("8");

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  function toggleCert(type: string, cert: string) {
    setCertMap(m => {
      const cur = m[type] || [];
      return { ...m, [type]: cur.includes(cert) ? cur.filter(c => c !== cert) : [...cur, cert] };
    });
  }

  return (
    <div>
      {/* PTW Procedure Training global banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: ptwMandatory ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${ptwMandatory ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`, borderRadius: 10, padding: "0.875rem 1.25rem", marginBottom: "1rem" }}>
        <Toggle value={ptwMandatory} onChange={setPtwMandatory} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2C2C2C" }}>
            PTW Procedure Training — Mandatory for ALL Permit Types
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px", borderRadius: 4, marginLeft: 8, background: "rgba(108,140,255,0.1)", color: "#6c8cff", border: "1px solid rgba(108,140,255,0.2)" }}>IS 17893 §1.17</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#6A6A6A", marginTop: 2 }}>Any worker without PTW Procedure Training is blocked from ALL permit assignments regardless of type.</div>
        </div>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: ptwMandatory ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: ptwMandatory ? "#16A34A" : "#DC2626", border: `1px solid ${ptwMandatory ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`, whiteSpace: "nowrap" }}>
          {ptwMandatory ? "Enforced" : "Disabled"}
        </span>
      </div>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.25rem", background: "#F3F4F6", borderRadius: 8, padding: 3, width: "fit-content" }}>
        {[{ id: "validity", label: "Validity & Rules" }, { id: "certs", label: "Cert Requirements (§1.16)" }, { id: "audit", label: "Audit Config (§6.1)" }, { id: "custom", label: "Custom Permit Types (§2.1)" }].map(s => (
          <button key={s.id} onClick={() => setSub(s.id as "validity" | "certs" | "audit" | "custom")} style={{ padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, background: sub === s.id ? "#FFFFFF" : "transparent", color: sub === s.id ? "#F58634" : "#6A6A6A", boxShadow: sub === s.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            {s.label}
          </button>
        ))}
      </div>

      {saved && (
        <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: "1rem", fontSize: "0.78rem", color: "#16A34A", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={14} /> Changes saved successfully
        </div>
      )}

      {/* ── Validity & Rules ── */}
      {sub === "validity" && (
        <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table-base">
            <thead><tr><th>Permit Type</th><th>Max Validity</th><th>Min Workers</th><th>SO Review</th><th>Gas Test</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {PERMIT_TYPES.map(pt => {
                const rule = rules[pt.value];
                const isEditing = editType === pt.value;
                return (
                  <tr key={pt.value}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1.1rem" }}>{pt.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{pt.value}</span>
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <input type="number" value={editHours} onChange={e => setEditHours(e.target.value)} style={{ width: 60, padding: "3px 6px", fontSize: "0.8rem" }} />
                          <span style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>hrs</span>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 600, color: "#2C2C2C" }}>{rule.maxHours >= 168 ? `${rule.maxHours / 24}d` : `${rule.maxHours}h`} <span style={{ fontSize: "0.65rem", color: "#6A6A6A" }}>max</span></span>
                      )}
                    </td>
                    <td>
                      {isEditing ? <input type="number" value={editMin} onChange={e => setEditMin(e.target.value)} style={{ width: 50, padding: "3px 6px", fontSize: "0.8rem" }} /> : <span style={{ fontWeight: 600 }}>{rule.minWorkers}</span>}
                    </td>
                    <td><Toggle value={rule.soRequired} onChange={v => setRules(r => ({ ...r, [pt.value]: { ...r[pt.value], soRequired: v } }))} /></td>
                    <td><Toggle value={rule.gasTestRequired} onChange={v => setRules(r => ({ ...r, [pt.value]: { ...r[pt.value], gasTestRequired: v } }))} /></td>
                    <td><Toggle value={rule.active} onChange={v => setRules(r => ({ ...r, [pt.value]: { ...r[pt.value], active: v } }))} /></td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-success btn-sm" onClick={() => { setRules(r => ({ ...r, [pt.value]: { ...r[pt.value], maxHours: Number(editHours) || r[pt.value].maxHours, minWorkers: Number(editMin) || r[pt.value].minWorkers } })); setEditType(null); flash(); }} style={{ padding: "3px 8px" }}><Save size={11} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditType(null)} style={{ padding: "3px 8px" }}><X size={11} /></button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditType(pt.value); setEditHours(String(rule.maxHours)); setEditMin(String(rule.minWorkers)); }} style={{ padding: "3px 7px" }}><Edit2 size={12} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Cert Requirements ── */}
      {sub === "certs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ fontSize: "0.78rem", color: "#6A6A6A", background: "rgba(245,134,52,0.06)", border: "1px solid rgba(245,134,52,0.15)", borderRadius: 8, padding: "8px 14px" }}>
            IS 17893 §1.16 — Certifications required for workers to be eligible for each permit type.
          </div>
          {PERMIT_TYPES.map(pt => {
            const required = certMap[pt.value] || [];
            return (
              <div key={pt.value} className="ptw-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.875rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{pt.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#2C2C2C" }}>{pt.value}</span>
                  <span style={{ fontSize: "0.68rem", background: "rgba(245,134,52,0.1)", color: "#F58634", border: "1px solid rgba(245,134,52,0.2)", borderRadius: 4, padding: "1px 7px" }}>{required.length} required</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ALL_CERTS.map(cert => {
                    const active = required.includes(cert);
                    return (
                      <button key={cert} onClick={() => toggleCert(pt.value, cert)} style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, background: active ? "rgba(245,134,52,0.1)" : "#F9FAFB", color: active ? "#F58634" : "#6A6A6A", border: `1px solid ${active ? "rgba(245,134,52,0.3)" : "#E5E7EB"}`, display: "flex", alignItems: "center", gap: 5 }}>
                        {active ? <CheckCircle size={11} /> : <Plus size={11} />}
                        {cert}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Audit Config ── */}
      {sub === "audit" && (
        <div>
          <div style={{ fontSize: "0.78rem", color: "#6A6A6A", background: "rgba(196,108,255,0.06)", border: "1px solid rgba(196,108,255,0.15)", borderRadius: 8, padding: "8px 14px", marginBottom: "1rem" }}>
            IS 17893 §6.1 — Configure mandatory audit frequency, minimum video count, and fallback options per permit type.
          </div>
          <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table-base">
              <thead>
                <tr><th>Permit Type</th><th>Audit Required</th><th>Frequency</th><th>Min Videos</th><th>Fallback (Photo/Manual)</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {PERMIT_TYPES.map(pt => {
                  const cfg = auditConfig[pt.value];
                  const isEditing = editAuditType === pt.value;
                  return (
                    <tr key={pt.value}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "1.1rem" }}>{pt.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{pt.value}</span>
                        </div>
                      </td>
                      <td><Toggle value={cfg.required} onChange={v => setAuditConfig(a => ({ ...a, [pt.value]: { ...a[pt.value], required: v } }))} /></td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input type="number" value={editFreq} onChange={e => setEditFreq(e.target.value)} style={{ width: 55, padding: "3px 6px", fontSize: "0.8rem" }} />
                            <span style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>hrs</span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 600, color: cfg.required ? "#2C2C2C" : "#9CA3AF" }}>
                            Every {cfg.frequencyHours}h {cfg.required ? "" : <span style={{ fontSize: "0.65rem", color: "#9CA3AF" }}>(disabled)</span>}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input type="number" value={editVids} onChange={e => setEditVids(e.target.value)} style={{ width: 50, padding: "3px 6px", fontSize: "0.8rem" }} />
                            <Video size={12} color="#6A6A6A" />
                          </div>
                        ) : (
                          <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 5, color: cfg.required ? "#2C2C2C" : "#9CA3AF" }}>
                            <Video size={12} />{cfg.minVideos}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Toggle value={cfg.fallbackAllowed} onChange={v => setAuditConfig(a => ({ ...a, [pt.value]: { ...a[pt.value], fallbackAllowed: v } }))} />
                          <span style={{ fontSize: "0.72rem", color: cfg.fallbackAllowed ? "#16A34A" : "#DC2626" }}>
                            {cfg.fallbackAllowed ? "Allowed" : "Video only"}
                          </span>
                        </div>
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="btn btn-success btn-sm" onClick={() => { setAuditConfig(a => ({ ...a, [pt.value]: { ...a[pt.value], frequencyHours: Number(editFreq) || a[pt.value].frequencyHours, minVideos: Number(editVids) || a[pt.value].minVideos } })); setEditAuditType(null); flash(); }} style={{ padding: "3px 8px" }}><Save size={11} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditAuditType(null)} style={{ padding: "3px 8px" }}><X size={11} /></button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditAuditType(pt.value); setEditFreq(String(cfg.frequencyHours)); setEditVids(String(cfg.minVideos)); }} style={{ padding: "3px 7px" }}><Edit2 size={12} /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Permit Types sub-tab */}
      {sub === "custom" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#2C2C2C" }}>Custom Permit Types</div>
              <div style={{ fontSize: "0.72rem", color: "#6A6A6A", marginTop: 2 }}>7 IS 17893 standard types are protected and cannot be deleted. Add custom types below.</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddCustom(v => !v)}><Plus size={13} /> Add Custom Type</button>
          </div>

          {showAddCustom && (
            <div style={{ background: "rgba(245,134,52,0.05)", border: "1px solid rgba(245,134,52,0.2)", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#F58634", marginBottom: "0.75rem" }}>New Custom Permit Type</div>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Icon</label>
                  <input value={newCustomIcon} onChange={e => setNewCustomIcon(e.target.value)} style={{ textAlign: "center", fontSize: "1.1rem" }} maxLength={2} />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Permit Type Label *</label>
                  <input value={newCustomLabel} onChange={e => setNewCustomLabel(e.target.value)} placeholder="e.g. Pressure Testing, Blasting…" />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Max Hours</label>
                  <input type="number" value={newCustomHours} onChange={e => setNewCustomHours(e.target.value)} min={1} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary btn-sm" disabled={!newCustomLabel.trim()} onClick={() => {
                  setCustomTypes(prev => [...prev, { id: `CT${Date.now()}`, label: newCustomLabel.trim(), icon: newCustomIcon, maxHours: Number(newCustomHours) || 8, soRequired: false, active: true }]);
                  setNewCustomLabel(""); setNewCustomIcon("📋"); setNewCustomHours("8"); setShowAddCustom(false);
                }} style={{ opacity: newCustomLabel.trim() ? 1 : 0.4 }}><CheckCircle size={13} /> Create Type</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddCustom(false)}><X size={13} /> Cancel</button>
              </div>
            </div>
          )}

          <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table-base">
              <thead><tr><th>Type</th><th>Label</th><th>Max Hours</th><th>SO Required</th><th>Source</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {PERMIT_TYPES.map(pt => (
                  <tr key={pt.value}>
                    <td style={{ fontSize: "1.1rem" }}>{pt.icon}</td>
                    <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{pt.value}</td>
                    <td>{DEFAULT_VALIDITY[pt.value]?.maxHours ?? "—"}h</td>
                    <td>{DEFAULT_VALIDITY[pt.value]?.soRequired ? <span style={{ color: "#16A34A", fontWeight: 700, fontSize: "0.72rem" }}>Yes</span> : <span style={{ color: "#6A6A6A", fontSize: "0.72rem" }}>No</span>}</td>
                    <td><span style={{ fontSize: "0.65rem", background: "rgba(108,140,255,0.1)", color: "#6c8cff", borderRadius: 4, padding: "1px 6px", border: "1px solid rgba(108,140,255,0.2)", fontWeight: 700 }}>IS 17893</span></td>
                    <td><span style={{ fontSize: "0.65rem", background: "rgba(22,163,74,0.1)", color: "#16A34A", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>Protected</span></td>
                    <td style={{ color: "#9CA3AF", fontSize: "0.72rem" }}>Cannot delete</td>
                  </tr>
                ))}
                {customTypes.map(ct => (
                  <tr key={ct.id}>
                    <td style={{ fontSize: "1.1rem" }}>{ct.icon}</td>
                    <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{ct.label}</td>
                    <td>{ct.maxHours}h</td>
                    <td><Toggle value={ct.soRequired} onChange={v => setCustomTypes(prev => prev.map(t => t.id === ct.id ? { ...t, soRequired: v } : t))} /></td>
                    <td><span style={{ fontSize: "0.65rem", background: "rgba(245,134,52,0.1)", color: "#F58634", borderRadius: 4, padding: "1px 6px", border: "1px solid rgba(245,134,52,0.2)", fontWeight: 700 }}>Custom</span></td>
                    <td><Toggle value={ct.active} onChange={v => setCustomTypes(prev => prev.map(t => t.id === ct.id ? { ...t, active: v } : t))} /></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setCustomTypes(prev => prev.filter(t => t.id !== ct.id))} style={{ padding: "3px 7px", color: "#DC2626" }}><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APPROVAL CHAINS TAB ─────────────────────────────────────────────────────

function ApprovalChainsTab() {
  const [chains, setChains] = useState<Record<string, { role: string; label: string; color: string }[]>>({ ...DEFAULT_CHAINS });
  const [saved, setSaved] = useState(false);
  function removeStep(type: string, idx: number) { setChains(c => ({ ...c, [type]: c[type].filter((_, i) => i !== idx) })); }
  function saveChains() { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.78rem", color: "#6A6A6A", background: "rgba(245,134,52,0.06)", border: "1px solid rgba(245,134,52,0.15)", borderRadius: 8, padding: "8px 14px", flex: 1, marginRight: "1rem" }}>
          IS 17893 §3.1 — Configure approval chain per permit type. Changes take effect on newly submitted permits.
        </div>
        <button className="btn btn-primary btn-sm" onClick={saveChains}><Save size={12} /> Save All Chains</button>
      </div>
      {saved && <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: "1rem", fontSize: "0.78rem", color: "#16A34A", display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={14} /> Approval chains saved</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {PERMIT_TYPES.map(pt => {
          const chain = chains[pt.value] || [];
          return (
            <div key={pt.value} className="ptw-card" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.1rem" }}>{pt.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#2C2C2C" }}>{pt.value}</span>
                <span style={{ fontSize: "0.68rem", color: "#6A6A6A" }}>{chain.length} approval level{chain.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(108,140,255,0.1)", border: "1.5px solid rgba(108,140,255,0.3)", fontSize: "0.75rem", fontWeight: 600, color: "#6c8cff" }}>Requester</div>
                  <ChevronRight size={14} color="#9CA3AF" style={{ margin: "0 4px" }} />
                </div>
                {chain.map((step, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ padding: "6px 12px", borderRadius: 8, background: `${step.color}18`, border: `1.5px solid ${step.color}50`, fontSize: "0.75rem", fontWeight: 600, color: step.color, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.7rem" }}>L{idx + 1}</span>
                      {step.label}
                      <button onClick={() => removeStep(pt.value, idx)} style={{ background: "none", border: "none", cursor: "pointer", color: step.color, opacity: 0.6, padding: 0, display: "flex", alignItems: "center" }}><X size={11} /></button>
                    </div>
                    {idx < chain.length - 1 && <ChevronRight size={14} color="#9CA3AF" style={{ margin: "0 4px" }} />}
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <ChevronRight size={14} color="#9CA3AF" style={{ margin: "0 4px" }} />
                  <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(22,163,74,0.1)", border: "1.5px solid rgba(22,163,74,0.3)", fontSize: "0.75rem", fontWeight: 600, color: "#16A34A" }}>✓ Approved</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DELEGATION TAB ───────────────────────────────────────────────────────────

function DelegationTab() {
  const [delegations, setDelegations] = useState<Delegation[]>(MOCK_DELEGATIONS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ fromName: "", toName: "", reason: "", fromDate: "", toDate: "", permitTypes: [] as string[] });

  function today() { return new Date().toISOString().slice(0, 10); }
  function isActive(d: Delegation) { return d.toDate >= today(); }
  function togglePermitType(type: string) { setForm(f => ({ ...f, permitTypes: f.permitTypes.includes(type) ? f.permitTypes.filter(t => t !== type) : [...f.permitTypes, type] })); }
  const canAdd = form.fromName && form.toName && form.toDate && form.fromName !== form.toName;

  function addDelegation() {
    const fromUser = INTERNAL_USERS.find(u => u.name === form.fromName);
    const toUser = INTERNAL_USERS.find(u => u.name === form.toName);
    if (!fromUser || !toUser) return;
    const d: Delegation = {
      id: `DEL${String(Date.now()).slice(-3)}`,
      fromName: fromUser.name, fromRole: fromUser.role,
      toName: toUser.name, toRole: `Acting ${fromUser.role}`,
      permitTypes: form.permitTypes.length > 0 ? form.permitTypes : PERMIT_TYPES.map(p => p.value),
      fromDate: form.fromDate || today(), toDate: form.toDate, reason: form.reason,
    };
    setDelegations(prev => [d, ...prev]);
    setShowAdd(false);
    setForm({ fromName: "", toName: "", reason: "", fromDate: "", toDate: "", permitTypes: [] });
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2C2C2C", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={15} color="#F58634" /> Internal Staff Directory
        </div>
        <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table-base">
            <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Email</th><th>Status</th></tr></thead>
            <tbody>
              {INTERNAL_USERS.map(u => {
                const activeDel = delegations.find(d => (d.fromName === u.name || d.toName === u.name) && isActive(d));
                return (
                  <tr key={u.name}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(245,134,52,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#F58634", flexShrink: 0 }}>{u.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{u.name}</span>
                      </div>
                    </td>
                    <td><span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#F58634" }}>{u.role}</span></td>
                    <td style={{ fontSize: "0.8rem", color: "#6A6A6A" }}>{u.dept}</td>
                    <td style={{ fontSize: "0.75rem", color: "#6A6A6A", fontFamily: "monospace" }}>{u.email}</td>
                    <td>
                      {activeDel ? <span style={{ fontSize: "0.68rem", background: "rgba(108,140,255,0.1)", color: "#6c8cff", border: "1px solid rgba(108,140,255,0.2)", borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>Delegated</span>
                        : <span style={{ fontSize: "0.68rem", background: "rgba(22,163,74,0.1)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>Active</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2C2C2C", display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarRange size={15} color="#F58634" /> Temporary Delegations (IS 17893 §3.12)
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(v => !v)}><Plus size={13} /> New Delegation</button>
        </div>
        {showAdd && (
          <div style={{ background: "rgba(245,134,52,0.06)", border: "1px solid rgba(245,134,52,0.2)", borderRadius: 10, padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#F58634", marginBottom: "0.875rem" }}>Create Temporary Delegation</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.875rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Delegating From *</label>
                <select value={form.fromName} onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))}>
                  <option value="">Select person…</option>
                  {INTERNAL_USERS.filter(u => ["Approver", "Safety Officer", "Area In-Charge"].includes(u.role)).map(u => <option key={u.name} value={u.name}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Delegating To *</label>
                <select value={form.toName} onChange={e => setForm(f => ({ ...f, toName: e.target.value }))}>
                  <option value="">Select person…</option>
                  {INTERNAL_USERS.filter(u => u.name !== form.fromName).map(u => <option key={u.name} value={u.name}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>From Date</label>
                <input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Until Date *</label>
                <input type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Reason</label>
                <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Annual leave, training, sick leave…" />
              </div>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 6 }}>Permit Types (leave unselected = all types)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PERMIT_TYPES.map(pt => { const active = form.permitTypes.includes(pt.value); return <button key={pt.value} onClick={() => togglePermitType(pt.value)} style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, background: active ? "rgba(245,134,52,0.1)" : "#F9FAFB", color: active ? "#F58634" : "#6A6A6A", border: `1px solid ${active ? "rgba(245,134,52,0.3)" : "#E5E7EB"}` }}>{pt.icon} {pt.value}</button>; })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary btn-sm" disabled={!canAdd} onClick={addDelegation} style={{ opacity: canAdd ? 1 : 0.4 }}><UserCheck size={13} /> Create Delegation</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}><X size={13} /> Cancel</button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {delegations.map(d => {
            const active = isActive(d);
            return (
              <div key={d.id} className="ptw-card" style={{ padding: "1rem 1.25rem", borderLeft: `3px solid ${active ? "#6c8cff" : "#9CA3AF"}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div><span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{d.fromName}</span><span style={{ fontSize: "0.72rem", color: "#6A6A6A", marginLeft: 6 }}>({d.fromRole})</span></div>
                    <ArrowRight size={14} color="#9CA3AF" />
                    <div><span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{d.toName}</span><span style={{ fontSize: "0.72rem", color: "#6c8cff", marginLeft: 6 }}>({d.toRole})</span></div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: active ? "rgba(108,140,255,0.1)" : "rgba(156,163,175,0.1)", color: active ? "#6c8cff" : "#9CA3AF", border: `1px solid ${active ? "rgba(108,140,255,0.2)" : "rgba(156,163,175,0.2)"}` }}>{active ? "Active" : "Expired"}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>{d.fromDate} → {d.toDate}</div>
                    <div style={{ fontSize: "0.68rem", color: "#9CA3AF", marginTop: 2 }}>{d.reason}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {d.permitTypes.map(t => <span key={t} style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 4, background: "#F3F4F6", color: "#6A6A6A", border: "1px solid #E5E7EB" }}>{t}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS TAB ────────────────────────────────────────────────────────

function NotificationsTab() {
  const [events, setEvents] = useState<NotifEvent[]>(NOTIFICATION_EVENTS_DEFAULT);
  const [saved, setSaved] = useState(false);

  function toggle(id: string, field: "email" | "sms" | "inApp") {
    setEvents(evs => evs.map(e => e.id === id ? { ...e, [field]: !e[field] } : e));
  }

  function saveAll() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  const modules = Array.from(new Set(events.map(e => e.module)));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.78rem", color: "#6A6A6A", background: "rgba(245,134,52,0.06)", border: "1px solid rgba(245,134,52,0.15)", borderRadius: 8, padding: "8px 14px", flex: 1, marginRight: "1rem" }}>
          Configure Email, SMS, and In-App notifications per event. P1: Email, SMS, In-App. P2: WhatsApp, IVR.
        </div>
        <button className="btn btn-primary btn-sm" onClick={saveAll}><Save size={12} /> Save Rules</button>
      </div>

      {saved && <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: "1rem", fontSize: "0.78rem", color: "#16A34A", display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={14} /> Notification rules saved</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {modules.map(mod => {
          const modEvents = events.filter(e => e.module === mod);
          const color = MODULE_COLORS[mod] || "#6A6A6A";
          const allEmail = modEvents.every(e => e.email);
          const allSms = modEvents.every(e => e.sms);
          const allInApp = modEvents.every(e => e.inApp);

          function toggleAll(field: "email" | "sms" | "inApp", current: boolean) {
            setEvents(evs => evs.map(e => e.module === mod ? { ...e, [field]: !current } : e));
          }

          return (
            <div key={mod} className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Module header */}
              <div style={{ padding: "10px 16px", background: `${color}08`, borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2C2C2C", flex: 1 }}>{mod}</span>
                <span style={{ fontSize: "0.65rem", color: "#6A6A6A", marginRight: 8 }}>Toggle all:</span>
                <button onClick={() => toggleAll("email", allEmail)} style={{ padding: "2px 8px", borderRadius: 5, border: `1px solid ${allEmail ? color + "50" : "#E5E7EB"}`, background: allEmail ? color + "15" : "#F9FAFB", color: allEmail ? color : "#9CA3AF", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer" }}>Email</button>
                <button onClick={() => toggleAll("sms", allSms)} style={{ padding: "2px 8px", borderRadius: 5, border: `1px solid ${allSms ? color + "50" : "#E5E7EB"}`, background: allSms ? color + "15" : "#F9FAFB", color: allSms ? color : "#9CA3AF", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer" }}>SMS</button>
                <button onClick={() => toggleAll("inApp", allInApp)} style={{ padding: "2px 8px", borderRadius: 5, border: `1px solid ${allInApp ? color + "50" : "#E5E7EB"}`, background: allInApp ? color + "15" : "#F9FAFB", color: allInApp ? color : "#9CA3AF", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer" }}>In-App</button>
              </div>

              {/* Events */}
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th style={{ width: 80, textAlign: "center" }}>Email</th>
                    <th style={{ width: 80, textAlign: "center" }}>SMS</th>
                    <th style={{ width: 90, textAlign: "center" }}>In-App</th>
                    <th style={{ width: 60, textAlign: "center" }}>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {modEvents.map(ev => (
                    <tr key={ev.id}>
                      <td style={{ fontSize: "0.8rem", color: "#2C2C2C" }}>{ev.event}</td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => toggle(ev.id, "email")} style={{ background: "none", border: "none", cursor: "pointer", color: ev.email ? "#16A34A" : "#D1D5DB", display: "inline-flex" }}>
                          {ev.email ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => toggle(ev.id, "sms")} style={{ background: "none", border: "none", cursor: "pointer", color: ev.sms ? "#16A34A" : "#D1D5DB", display: "inline-flex" }}>
                          {ev.sms ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => toggle(ev.id, "inApp")} style={{ background: "none", border: "none", cursor: "pointer", color: ev.inApp ? "#16A34A" : "#D1D5DB", display: "inline-flex" }}>
                          {ev.inApp ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: (ev.email || ev.sms || ev.inApp) ? "#16A34A" : "#D1D5DB", margin: "0 auto" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DOCUMENTS & PPE TAB ─────────────────────────────────────────────────────

function DocumentsTab() {
  const { state } = useStore();
  const [sub, setSub] = useState<"docs" | "agreements" | "ppe">("docs");
  const [filterContractor, setFilterContractor] = useState("all");
  const [docSaved, setDocSaved] = useState(false);
  const [schedules, setSchedules] = useState(MOCK_REPORT_SCHEDULES);

  const docs = MOCK_COMPANY_DOCS.filter(d => filterContractor === "all" || d.contractorId === filterContractor);
  const agreements = MOCK_AGREEMENTS.filter(a => filterContractor === "all" || a.contractorId === filterContractor);

  const docStatusColor = (s: CompanyDocument["status"]) =>
    s === "Valid" ? "#16A34A" : s === "Expiring" ? "#D97706" : "#DC2626";

  const agStatusColor = (s: ContractAgreement["status"]) =>
    s === "Active" ? "#16A34A" : s === "Renewing" ? "#D97706" : "#DC2626";

  const ppeAvail = (item: PPEItem) => item.stock - item.issued;
  const ppePct = (item: PPEItem) => Math.round((item.issued / item.stock) * 100);

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.25rem", background: "#F3F4F6", borderRadius: 8, padding: 3, width: "fit-content" }}>
        {[{ id: "docs", label: "Company Documents (§1.3)" }, { id: "agreements", label: "Contract Agreements (§1.2)" }, { id: "ppe", label: "PPE Inventory (§1.6)" }].map(s => (
          <button key={s.id} onClick={() => setSub(s.id as "docs" | "agreements" | "ppe")} style={{ padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, background: sub === s.id ? "#FFFFFF" : "transparent", color: sub === s.id ? "#F58634" : "#6A6A6A", boxShadow: sub === s.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Contractor filter (for docs + agreements) */}
      {sub !== "ppe" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
          <select value={filterContractor} onChange={e => setFilterContractor(e.target.value)} style={{ width: "auto", minWidth: 220 }}>
            <option value="all">All Contractors</option>
            {state.contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {sub === "docs" && (
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              {["Valid", "Expiring", "Expired"].map(s => {
                const count = docs.filter(d => d.status === s).length;
                const color = docStatusColor(s as CompanyDocument["status"]);
                return count > 0 ? (
                  <span key={s} style={{ fontSize: "0.7rem", padding: "3px 9px", borderRadius: 6, background: `${color}15`, color, border: `1px solid ${color}30`, fontWeight: 700 }}>
                    {count} {s}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Company Documents */}
      {sub === "docs" && (
        <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table-base">
            <thead><tr><th>Contractor</th><th>Document Type</th><th>Doc / Reg No.</th><th>Expiry Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {docs.map(doc => {
                const contractor = state.contractors.find(c => c.id === doc.contractorId);
                const color = docStatusColor(doc.status);
                return (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{contractor?.name ?? doc.contractorId}</td>
                    <td style={{ fontSize: "0.82rem" }}>{doc.type}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#6A6A6A" }}>{doc.docNo}</td>
                    <td style={{ fontSize: "0.82rem" }}>{doc.expiry}</td>
                    <td>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px", fontSize: "0.68rem" }}>Replace</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px" }}><ExternalLink size={11} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {docs.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#9CA3AF", fontSize: "0.82rem" }}>No documents found</div>}
        </div>
      )}

      {/* Contract Agreements */}
      {sub === "agreements" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.875rem" }}>
            <button className="btn btn-primary btn-sm"><Plus size={13} /> New Agreement</button>
          </div>
          <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table-base">
              <thead><tr><th>Ref No.</th><th>Contractor</th><th>Work Type</th><th>Worker Quota</th><th>Valid From</th><th>Valid To</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {agreements.map(ag => {
                  const contractor = state.contractors.find(c => c.id === ag.contractorId);
                  const color = agStatusColor(ag.status);
                  return (
                    <tr key={ag.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#6c8cff", fontWeight: 700 }}>{ag.refNo}</td>
                      <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{contractor?.name ?? ag.contractorId}</td>
                      <td style={{ fontSize: "0.82rem" }}>{ag.workType}</td>
                      <td style={{ fontWeight: 600 }}>{ag.quota} workers</td>
                      <td style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{ag.fromDate}</td>
                      <td style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{ag.toDate}</td>
                      <td><span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: `${color}15`, color, border: `1px solid ${color}30` }}>{ag.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px", fontSize: "0.68rem" }}>Renew</button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px" }}><Edit2 size={11} /></button>
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

      {/* PPE Inventory */}
      {sub === "ppe" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem", marginBottom: "1.25rem" }}>
            <KpiCard label="Total PPE Items" value={MOCK_PPE.length} sub="item types tracked" color="#F58634" icon={<Shield size={16} />} />
            <KpiCard label="Total Issued" value={MOCK_PPE.reduce((s, p) => s + p.issued, 0)} sub="currently with workers" color="#6c8cff" icon={<Users size={16} />} />
            <KpiCard label="Low Stock Items" value={MOCK_PPE.filter(p => ppePct(p) >= 85).length} sub="≥85% issued" color="#D97706" icon={<AlertTriangle size={16} />} />
            <KpiCard label="Consumables" value={MOCK_PPE.filter(p => p.consumable).length} sub="items requiring replenishment" color="#16A34A" icon={<RefreshCw size={16} />} />
          </div>
          <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table-base">
              <thead><tr><th>Item</th><th>Category</th><th>Type</th><th>In Stock</th><th>Issued</th><th>Available</th><th>Utilisation</th></tr></thead>
              <tbody>
                {MOCK_PPE.map(item => {
                  const avail = ppeAvail(item);
                  const pct = ppePct(item);
                  const barColor = pct >= 85 ? "#DC2626" : pct >= 60 ? "#D97706" : "#16A34A";
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.name}</td>
                      <td style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{item.category}</td>
                      <td><span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: 4, background: item.consumable ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)", color: item.consumable ? "#DC2626" : "#16A34A", fontWeight: 700 }}>{item.consumable ? "Consumable" : "Returnable"}</span></td>
                      <td style={{ fontWeight: 600 }}>{item.stock} {item.unit}</td>
                      <td style={{ fontWeight: 600, color: "#6A6A6A" }}>{item.issued}</td>
                      <td style={{ fontWeight: 700, color: avail <= 3 ? "#DC2626" : "#16A34A" }}>{avail}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: barColor, width: 32 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {void docSaved}{void setDocSaved}{void schedules}{void setSchedules}
        </>
      )}
    </div>
  );
}

// ─── SYSTEM SETTINGS TAB ─────────────────────────────────────────────────────

function SystemSettingsTab() {
  const [sub, setSub] = useState<"settings" | "sops" | "reports" | "users">("settings");
  const [settings, setSettings] = useState<SystemSetting>({ ...DEFAULT_SYSTEM_SETTINGS });
  const [saved, setSaved] = useState(false);
  const [schedules, setSchedules] = useState<ReportSchedule[]>(MOCK_REPORT_SCHEDULES);
  const [sops, setSops] = useState<SOPDoc[]>(MOCK_SOPS);
  const [users, setUsers] = useState(INTERNAL_USERS.map((u, i) => ({ ...u, id: `USR${i + 1}` })));
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", role: "Requester", dept: "", email: "" });

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.25rem", background: "#F3F4F6", borderRadius: 8, padding: 3, width: "fit-content" }}>
        {[{ id: "settings", label: "General Settings" }, { id: "users", label: "User Management" }, { id: "sops", label: "SOP Library (§1.21)" }, { id: "reports", label: "Report Scheduling (§8.9)" }].map(s => (
          <button key={s.id} onClick={() => setSub(s.id as "settings" | "sops" | "reports" | "users")} style={{ padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, background: sub === s.id ? "#FFFFFF" : "transparent", color: sub === s.id ? "#F58634" : "#6A6A6A", boxShadow: sub === s.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            {s.label}
          </button>
        ))}
      </div>

      {saved && <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: "1rem", fontSize: "0.78rem", color: "#16A34A", display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={14} /> Settings saved successfully</div>}

      {/* General Settings */}
      {sub === "settings" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="ptw-card" style={{ padding: "1.25rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2C2C2C", marginBottom: "1rem" }}>Permit Configuration</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Permit Number Format</label>
                <select value={settings.permitNumberFormat} onChange={e => setSettings(s => ({ ...s, permitNumberFormat: e.target.value }))}>
                  <option value="TYPE-YEAR-SEQ">TYPE-YEAR-SEQ (e.g. HW-2026-00123)</option>
                  <option value="SITE-TYPE-SEQ">SITE-TYPE-SEQ (e.g. FAC1-HW-00123)</option>
                  <option value="SEQ-ONLY">Sequential Only (e.g. PTW-00123)</option>
                </select>
                <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginTop: 3 }}>Preview: <code>HW-2026-00124</code></div>
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Permit Expiry Warning (hours before)</label>
                <input type="number" value={settings.permitExpiryWarnHours} min={1} max={24} onChange={e => setSettings(s => ({ ...s, permitExpiryWarnHours: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Auto-flag Unclosed Permits After (days)</label>
                <input type="number" value={settings.autoCloseAfterDays} min={1} max={30} onChange={e => setSettings(s => ({ ...s, autoCloseAfterDays: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <div className="ptw-card" style={{ padding: "1.25rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2C2C2C", marginBottom: "1rem" }}>Compliance & Retention</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Data Retention Period (years)</label>
                <input type="number" value={settings.dataRetentionYears} min={3} max={10} onChange={e => setSettings(s => ({ ...s, dataRetentionYears: Number(e.target.value) }))} />
                <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginTop: 3 }}>IS 17893 minimum: 3 years</div>
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Approval Escalation Grace Period (mins)</label>
                <input type="number" value={settings.escalationGraceMins} min={10} max={240} onChange={e => setSettings(s => ({ ...s, escalationGraceMins: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Audit Completion Grace Period (hours)</label>
                <input type="number" value={settings.auditGraceHours} min={1} max={12} onChange={e => setSettings(s => ({ ...s, auditGraceHours: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary btn-sm" onClick={flash}><Save size={13} /> Save Settings</button>
          </div>
        </div>
      )}

      {/* User Management */}
      {sub === "users" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.875rem" }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(v => !v)}><Plus size={13} /> Add User</button>
          </div>
          {showAddUser && (
            <div style={{ background: "rgba(108,140,255,0.05)", border: "1px solid rgba(108,140,255,0.2)", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#6c8cff", marginBottom: "0.75rem" }}>New System User</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                {[{ label: "Full Name *", key: "name", placeholder: "Full name" }, { label: "Email *", key: "email", placeholder: "user@factory.in" }, { label: "Department", key: "dept", placeholder: "HSE, Engineering…" }].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: "0.7rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input value={(newUser as Record<string, string>)[f.key]} onChange={e => setNewUser(u => ({ ...u, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: "0.7rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 4 }}>Role</label>
                  <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                    {["Factory Admin", "Approver", "Safety Officer", "Area In-Charge", "Auditor", "Requester", "Gate Guard"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary btn-sm" disabled={!newUser.name.trim() || !newUser.email.trim()} onClick={() => {
                  setUsers(prev => [...prev, { ...newUser, id: `USR${Date.now()}`, status: "Active" }]);
                  setNewUser({ name: "", role: "Requester", dept: "", email: "" }); setShowAddUser(false);
                }} style={{ opacity: (newUser.name.trim() && newUser.email.trim()) ? 1 : 0.4 }}><CheckCircle size={13} /> Create User</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddUser(false)}><X size={13} /> Cancel</button>
              </div>
            </div>
          )}
          <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table-base">
              <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(108,140,255,0.12)", border: "1px solid rgba(108,140,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#6c8cff" }}>
                          {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{u.name}</span>
                      </div>
                    </td>
                    <td><span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#F58634" }}>{u.role}</span></td>
                    <td style={{ fontSize: "0.8rem", color: "#6A6A6A" }}>{u.dept}</td>
                    <td style={{ fontSize: "0.78rem", color: "#6A6A6A", fontFamily: "monospace" }}>{u.email}</td>
                    <td><span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: u.status === "Active" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: u.status === "Active" ? "#16A34A" : "#DC2626" }}>{u.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px" }}><Edit2 size={12} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: x.status === "Active" ? "Suspended" : "Active" } : x))} style={{ padding: "3px 7px", color: u.status === "Active" ? "#D97706" : "#16A34A" }}>
                          {u.status === "Active" ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* SOP Library */}
      {sub === "sops" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.875rem" }}>
            <button className="btn btn-primary btn-sm"><Plus size={13} /> Upload SOP</button>
          </div>
          <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table-base">
              <thead><tr><th>Title</th><th>Permit Type</th><th>Version</th><th>Last Updated</th><th>File Size</th><th>Actions</th></tr></thead>
              <tbody>
                {sops.map(sop => (
                  <tr key={sop.id}>
                    <td style={{ fontWeight: 600, fontSize: "0.85rem", color: "#2C2C2C" }}>{sop.title}</td>
                    <td>
                      <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 5, background: "rgba(245,134,52,0.1)", color: "#F58634", border: "1px solid rgba(245,134,52,0.2)", fontWeight: 600 }}>
                        {sop.permitType}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#6c8cff", fontWeight: 700 }}>{sop.version}</td>
                    <td style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{sop.updatedDate}</td>
                    <td style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{sop.fileSize}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px", fontSize: "0.68rem" }}>View</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px", fontSize: "0.68rem" }}>Replace</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSops(prev => prev.filter(s => s.id !== sop.id))} style={{ padding: "3px 7px", color: "#DC2626" }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Report Scheduling */}
      {sub === "reports" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.875rem" }}>
            <button className="btn btn-primary btn-sm"><Plus size={13} /> New Schedule</button>
          </div>
          <div className="ptw-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table-base">
              <thead><tr><th>Report Name</th><th>Frequency</th><th>Format</th><th>Recipients</th><th>Last Run</th><th>Active</th><th>Actions</th></tr></thead>
              <tbody>
                {schedules.map(rs => (
                  <tr key={rs.id}>
                    <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>{rs.name}</td>
                    <td>
                      <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 5, background: "rgba(108,140,255,0.1)", color: "#6c8cff", fontWeight: 700 }}>
                        {rs.frequency}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", fontWeight: 600 }}>{rs.format}</td>
                    <td style={{ fontSize: "0.72rem", color: "#6A6A6A", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rs.recipients}</td>
                    <td style={{ fontSize: "0.78rem", color: "#6A6A6A" }}>{rs.lastRun}</td>
                    <td><Toggle value={rs.active} onChange={v => setSchedules(prev => prev.map(x => x.id === rs.id ? { ...x, active: v } : x))} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px" }}><Edit2 size={12} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px", fontSize: "0.68rem" }}>Run Now</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",        label: "Overview",           icon: <LayoutDashboard size={14} /> },
  { id: "contractors",     label: "Contractors",        icon: <Building2 size={14} /> },
  { id: "workers",         label: "Workers",            icon: <Users size={14} /> },
  { id: "documents",       label: "Docs & PPE",         icon: <FileText size={14} /> },
  { id: "permit_setup",    label: "Permit Setup",       icon: <Shield size={14} /> },
  { id: "approval_chains", label: "Approval Chains",    icon: <GitBranch size={14} /> },
  { id: "delegation",      label: "Delegation",         icon: <UserCheck size={14} /> },
  { id: "notifications",   label: "Notifications",      icon: <Bell size={14} /> },
  { id: "system",          label: "System Settings",    icon: <Activity size={14} /> },
];

export default function AdminPanel() {
  const { state } = useStore();
  const [tab, setTab] = useState<AdminTab>("overview");
  const TAB_COUNTS: Partial<Record<AdminTab, number>> = {
    contractors: state.contractors.length,
    workers: state.workers.length,
    notifications: NOTIFICATION_EVENTS_DEFAULT.length,
  };
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>System Administration</h1>
        <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>IS 17893 configuration, contractor management, and system setup</p>
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", marginBottom: "1.5rem", gap: 2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", borderBottom: `2px solid ${tab === t.id ? "#F58634" : "transparent"}`, color: tab === t.id ? "#F58634" : "#6A6A6A", padding: "8px 14px", fontSize: "0.8rem", fontWeight: 600, marginBottom: -1, transition: "all 0.15s ease" }}>
            {t.icon}{t.label}
            {TAB_COUNTS[t.id] !== undefined && (
              <span style={{ fontSize: "0.65rem", background: tab === t.id ? "rgba(245,134,52,0.12)" : "#F3F4F6", color: tab === t.id ? "#F58634" : "#6A6A6A", borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>{TAB_COUNTS[t.id]}</span>
            )}
          </button>
        ))}
      </div>
      {tab === "overview"        && <OverviewTab />}
      {tab === "contractors"     && <ContractorsTab />}
      {tab === "workers"         && <WorkersTab />}
      {tab === "documents"       && <DocumentsTab />}
      {tab === "permit_setup"    && <PermitSetupTab />}
      {tab === "approval_chains" && <ApprovalChainsTab />}
      {tab === "delegation"      && <DelegationTab />}
      {tab === "notifications"   && <NotificationsTab />}
      {tab === "system"          && <SystemSettingsTab />}
    </div>
  );
}
