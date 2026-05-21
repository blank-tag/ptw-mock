export type RoleId =
  | "safety_officer"
  | "requester"
  | "approver"
  | "auditor"
  | "area_incharge"
  | "factory_admin"
  | "contractor_supervisor"
  | "gate_guard";

export interface RolePersona {
  id: RoleId;
  label: string;
  name: string;
  title: string;
  color: string;
  defaultRoute: string;
  navItems: string[];
  canCreatePermit: boolean;
  description: string;
}

export const ROLES: RolePersona[] = [
  {
    id: "safety_officer",
    label: "Safety Officer",
    name: "Sunita Reddy",
    title: "Safety Officer",
    color: "#6cffa8",
    defaultRoute: "/",
    navItems: ["/", "/permits", "/approval", "/wip", "/audit", "/closure", "/reports"],
    canCreatePermit: false,
    description: "Reviews high-risk permits, manages NCs, Stop Work authority",
  },
  {
    id: "requester",
    label: "Requester",
    name: "Rahul Sharma",
    title: "Maintenance Engineer",
    color: "#6c8cff",
    defaultRoute: "/permits",
    navItems: ["/", "/permits", "/wip"],
    canCreatePermit: true,
    description: "Raises permit requests, tracks own permit status",
  },
  {
    id: "approver",
    label: "Approver",
    name: "Priya Nair",
    title: "Senior Engineer",
    color: "#ffc46c",
    defaultRoute: "/approval",
    navItems: ["/", "/permits", "/approval", "/wip"],
    canCreatePermit: false,
    description: "Reviews and approves/rejects submitted permits",
  },
  {
    id: "auditor",
    label: "Auditor",
    name: "Vikram Patel",
    title: "HSE Auditor",
    color: "#c46cff",
    defaultRoute: "/audit",
    navItems: ["/", "/permits", "/audit", "/reports"],
    canCreatePermit: false,
    description: "Conducts audits, reviews AI flags, manages NC decisions",
  },
  {
    id: "area_incharge",
    label: "Area In-Charge",
    name: "Mohammed Al-Rashid",
    title: "Area In-Charge",
    color: "#ffc46c",
    defaultRoute: "/wip",
    navItems: ["/", "/permits", "/wip", "/closure"],
    canCreatePermit: false,
    description: "Monitors active permits, Hold/Suspend authority, verifies closure",
  },
  {
    id: "factory_admin",
    label: "Factory Admin",
    name: "Arun Kumar",
    title: "Factory Administrator",
    color: "#ff6c8c",
    defaultRoute: "/",
    navItems: ["/", "/permits", "/approval", "/gate", "/wip", "/audit", "/closure", "/reports", "/contractor", "/admin"],
    canCreatePermit: true,
    description: "Full system access, configuration, compliance monitoring",
  },
  {
    id: "contractor_supervisor",
    label: "Contractor Supervisor",
    name: "John Smith",
    title: "Contractor Supervisor · Apex Industrial",
    color: "#6cffa8",
    defaultRoute: "/contractor",
    navItems: ["/contractor", "/gate", "/wip", "/permits"],
    canCreatePermit: false,
    description: "Accepts permits, manages workers, initiates closure",
  },
  {
    id: "gate_guard",
    label: "Gate Guard",
    name: "Ramesh Kumar",
    title: "Gate Guard",
    color: "#8a92a6",
    defaultRoute: "/gate",
    navItems: ["/gate"],
    canCreatePermit: false,
    description: "Gate entry checks — worker and permit validation",
  },
];

export const DEFAULT_ROLE = ROLES[0];

export function getRoleById(id: RoleId): RolePersona {
  return ROLES.find(r => r.id === id) ?? DEFAULT_ROLE;
}
