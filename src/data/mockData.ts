import type { Permit, Worker, Contractor, NonConformance, AuditRecord } from "../types";

export const PERMIT_TYPES = [
  { value: "Hot Work", icon: "🔥", typeClass: "permit-type-hot", color: "#ff6c8c" },
  { value: "Cold Work", icon: "❄️", typeClass: "permit-type-cold", color: "#6c8cff" },
  { value: "Confined Space", icon: "🕳️", typeClass: "permit-type-cs", color: "#c46cff" },
  { value: "Excavation", icon: "⛏️", typeClass: "permit-type-exc", color: "#ffc46c" },
  { value: "Electrical", icon: "⚡", typeClass: "permit-type-elec", color: "#ffe04c" },
  { value: "Height Work", icon: "🏗️", typeClass: "permit-type-height", color: "#6cffa8" },
  { value: "Radiography", icon: "☢️", typeClass: "permit-type-radio", color: "#ff9632" },
] as const;

export const CERT_MAPPING: Record<string, string[]> = {
  "Hot Work": ["Welding Certificate", "Fire Safety Training", "Medical Fitness", "PTW Procedure Training"],
  "Cold Work": ["Basic Safety Training", "PTW Procedure Training"],
  "Confined Space": ["Confined Space Entry", "Gas Testing", "Rescue Training", "Medical Fitness", "PTW Procedure Training"],
  "Excavation": ["Excavation Safety", "Basic Safety Training", "PTW Procedure Training"],
  "Electrical": ["Electrical Competency", "Isolation Training", "Medical Fitness", "PTW Procedure Training"],
  "Height Work": ["Working at Height", "Harness Inspection", "Medical Fitness", "PTW Procedure Training"],
  "Radiography": ["Radiation Safety", "Medical Fitness", "Radiography Operator Cert", "PTW Procedure Training"],
};

export const HAZARD_LIBRARY: Record<string, { description: string; defaultRisk: "Low" | "Medium" | "High" }[]> = {
  "Hot Work": [
    { description: "Fire / explosion from ignition sources", defaultRisk: "High" },
    { description: "Toxic fumes and smoke inhalation", defaultRisk: "Medium" },
    { description: "Flash burns / UV radiation", defaultRisk: "High" },
    { description: "Presence of hydrocarbons or flammables", defaultRisk: "High" },
    { description: "Electrical hazards near work area", defaultRisk: "Medium" },
    { description: "Burns from molten metal splatter", defaultRisk: "Medium" },
  ],
  "Confined Space": [
    { description: "Oxygen deficiency or enrichment", defaultRisk: "High" },
    { description: "Combustible / flammable gas accumulation", defaultRisk: "High" },
    { description: "Toxic gas (H₂S, CO, etc.)", defaultRisk: "High" },
    { description: "Flooding / liquid ingress", defaultRisk: "High" },
    { description: "Restricted exit / entrapment", defaultRisk: "High" },
    { description: "Noise / heat stress", defaultRisk: "Medium" },
  ],
  "Electrical": [
    { description: "Electric shock / electrocution", defaultRisk: "High" },
    { description: "Arc flash / arc blast", defaultRisk: "High" },
    { description: "Inadequate isolation of energy", defaultRisk: "High" },
    { description: "Working near live conductors", defaultRisk: "High" },
    { description: "Capacitor discharge", defaultRisk: "Medium" },
  ],
  "Height Work": [
    { description: "Falls from height", defaultRisk: "High" },
    { description: "Falling objects / tools", defaultRisk: "High" },
    { description: "Unstable working platform", defaultRisk: "High" },
    { description: "Adverse weather conditions", defaultRisk: "Medium" },
    { description: "Fatigue at height", defaultRisk: "Medium" },
  ],
  "Excavation": [
    { description: "Collapse of excavation walls", defaultRisk: "High" },
    { description: "Underground utilities / services", defaultRisk: "High" },
    { description: "Vehicle / equipment proximity", defaultRisk: "High" },
    { description: "Toxic or flammable gas accumulation", defaultRisk: "Medium" },
    { description: "Flooding", defaultRisk: "Medium" },
  ],
  "Cold Work": [
    { description: "Slip/trip hazards", defaultRisk: "Low" },
    { description: "Manual handling injuries", defaultRisk: "Medium" },
    { description: "Chemical exposure", defaultRisk: "Medium" },
    { description: "Dust inhalation", defaultRisk: "Low" },
  ],
  "Radiography": [
    { description: "Ionizing radiation exposure", defaultRisk: "High" },
    { description: "Unauthorized personnel exposure", defaultRisk: "High" },
    { description: "Radioactive source mishandling", defaultRisk: "High" },
    { description: "Inadequate exclusion zone", defaultRisk: "High" },
  ],
};

export const CONTROL_LIBRARY: Record<string, { description: string; mandatory: boolean }[]> = {
  "Hot Work": [
    { description: "Fire extinguisher present and accessible", mandatory: true },
    { description: "Fire watch designated for 30 min post-work", mandatory: true },
    { description: "Combustibles removed / covered within 10m", mandatory: true },
    { description: "Gas testing confirmed clear", mandatory: true },
    { description: "Hot work completion form signed", mandatory: true },
    { description: "Area wetted / fireproof blankets used", mandatory: false },
  ],
  "Confined Space": [
    { description: "Continuous gas monitoring (O₂, LEL, H₂S, CO)", mandatory: true },
    { description: "Rescue team on standby", mandatory: true },
    { description: "Tripod + lifeline rigged", mandatory: true },
    { description: "Ventilation confirmed (16-25% O₂)", mandatory: true },
    { description: "Entry/exit log maintained", mandatory: true },
    { description: "Attendant posted outside at all times", mandatory: true },
  ],
  "Electrical": [
    { description: "LOTO applied and verified", mandatory: true },
    { description: "Isolation verified with test instrument", mandatory: true },
    { description: "Arc flash PPE worn", mandatory: true },
    { description: "Permit displayed at work location", mandatory: true },
    { description: "Barricading and signage in place", mandatory: false },
  ],
  "Height Work": [
    { description: "Full body harness worn and inspected", mandatory: true },
    { description: "Anchorage point rated min 15kN", mandatory: true },
    { description: "Tool tethering for all equipment", mandatory: true },
    { description: "Barricading below work zone", mandatory: true },
    { description: "Scaffold inspected and tagged", mandatory: false },
  ],
  "Excavation": [
    { description: "Utility services located and marked", mandatory: true },
    { description: "Shoring / benching / battered slopes", mandatory: true },
    { description: "Barriers and lights at perimeter", mandatory: true },
    { description: "Gas testing before entry", mandatory: true },
    { description: "Spoil placed >600mm from edge", mandatory: false },
  ],
  "Cold Work": [
    { description: "Area inspected for hazards", mandatory: true },
    { description: "Required PPE issued and worn", mandatory: true },
    { description: "Housekeeping maintained", mandatory: false },
  ],
  "Radiography": [
    { description: "Exclusion zone established and manned", mandatory: true },
    { description: "Radiation survey conducted pre-work", mandatory: true },
    { description: "Source secured when not in use", mandatory: true },
    { description: "Warning signs posted", mandatory: true },
    { description: "TLD badges worn by all personnel", mandatory: true },
  ],
};

export const mockContractors: Contractor[] = [
  {
    id: "C001",
    name: "Apex Industrial Services",
    status: "Active",
    scorecard: { totalPermits: 142, totalNCs: 8, ncRate: 5.6, repeatNCs: 1, closureCompliance: 96 },
    is17893Status: {
      "Hot Work": "green", "Cold Work": "green", "Confined Space": "amber",
      "Excavation": "green", "Electrical": "green", "Height Work": "green", "Radiography": "amber",
    },
  },
  {
    id: "C002",
    name: "SafeTech Contractors Ltd",
    status: "Active",
    scorecard: { totalPermits: 87, totalNCs: 14, ncRate: 16.1, repeatNCs: 3, closureCompliance: 82 },
    is17893Status: {
      "Hot Work": "amber", "Cold Work": "green", "Confined Space": "red",
      "Excavation": "amber", "Electrical": "red", "Height Work": "amber", "Radiography": "red",
    },
  },
  {
    id: "C003",
    name: "Bharat Engineering Works",
    status: "Active",
    scorecard: { totalPermits: 203, totalNCs: 11, ncRate: 5.4, repeatNCs: 0, closureCompliance: 98 },
    is17893Status: {
      "Hot Work": "green", "Cold Work": "green", "Confined Space": "green",
      "Excavation": "green", "Electrical": "green", "Height Work": "green", "Radiography": "green",
    },
  },
  {
    id: "C004",
    name: "Horizon Maintenance Co",
    status: "Active",
    scorecard: { totalPermits: 56, totalNCs: 9, ncRate: 16.1, repeatNCs: 2, closureCompliance: 78 },
    is17893Status: {
      "Hot Work": "red", "Cold Work": "amber", "Confined Space": "red",
      "Excavation": "amber", "Electrical": "amber", "Height Work": "red", "Radiography": "red",
    },
  },
];

export const mockWorkers: Worker[] = [
  {
    id: "W001", name: "Rajesh Kumar", role: "Supervisor", contractorId: "C001",
    photo: "RK", status: "Active",
    certifications: [
      { id: "cert1", name: "Welding Certificate", expiryDate: "2026-12-15", status: "Valid" },
      { id: "cert2", name: "Fire Safety Training", expiryDate: "2026-08-20", status: "Valid" },
      { id: "cert3", name: "Medical Fitness", expiryDate: "2026-06-30", status: "Valid" },
      { id: "cert4", name: "PTW Procedure Training", expiryDate: "2026-11-10", status: "Valid" },
    ],
  },
  {
    id: "W002", name: "Arjun Singh", role: "Worker", contractorId: "C001",
    photo: "AS", status: "Active",
    certifications: [
      { id: "cert5", name: "Welding Certificate", expiryDate: "2026-03-10", status: "Valid" },
      { id: "cert6", name: "Fire Safety Training", expiryDate: "2026-01-15", status: "Expiring" },
      { id: "cert7", name: "Medical Fitness", expiryDate: "2025-12-01", status: "Expired" },
      { id: "cert8", name: "PTW Procedure Training", expiryDate: "2026-09-20", status: "Valid" },
    ],
  },
  {
    id: "W003", name: "Suresh Patil", role: "Worker", contractorId: "C001",
    photo: "SP", status: "Active",
    certifications: [
      { id: "cert9", name: "Welding Certificate", expiryDate: "2026-10-05", status: "Valid" },
      { id: "cert10", name: "Fire Safety Training", expiryDate: "2026-10-05", status: "Valid" },
      { id: "cert11", name: "Medical Fitness", expiryDate: "2027-02-20", status: "Valid" },
      { id: "cert12", name: "PTW Procedure Training", expiryDate: "2026-12-31", status: "Valid" },
    ],
  },
  {
    id: "W004", name: "Priya Sharma", role: "Supervisor", contractorId: "C002",
    photo: "PS", status: "Active",
    certifications: [
      { id: "cert13", name: "Confined Space Entry", expiryDate: "2026-04-15", status: "Valid" },
      { id: "cert14", name: "Gas Testing", expiryDate: "2026-06-20", status: "Valid" },
      { id: "cert15", name: "Rescue Training", expiryDate: "2025-11-30", status: "Expired" },
      { id: "cert16", name: "Medical Fitness", expiryDate: "2026-08-10", status: "Valid" },
      { id: "cert17", name: "PTW Procedure Training", expiryDate: "2026-11-25", status: "Valid" },
    ],
  },
  {
    id: "W005", name: "Mohammed Rafi", role: "Worker", contractorId: "C002",
    photo: "MR", status: "Active",
    certifications: [
      { id: "cert18", name: "Confined Space Entry", expiryDate: "2026-07-10", status: "Valid" },
      { id: "cert19", name: "Gas Testing", expiryDate: "2026-07-10", status: "Valid" },
      { id: "cert20", name: "Rescue Training", expiryDate: "2026-07-10", status: "Valid" },
      { id: "cert21", name: "Medical Fitness", expiryDate: "2027-01-15", status: "Valid" },
      { id: "cert22", name: "PTW Procedure Training", expiryDate: "2026-10-30", status: "Valid" },
    ],
  },
  {
    id: "W006", name: "Amit Verma", role: "Supervisor", contractorId: "C003",
    photo: "AV", status: "Active",
    certifications: [
      { id: "cert23", name: "Electrical Competency", expiryDate: "2026-09-15", status: "Valid" },
      { id: "cert24", name: "Isolation Training", expiryDate: "2026-09-15", status: "Valid" },
      { id: "cert25", name: "Medical Fitness", expiryDate: "2027-03-20", status: "Valid" },
      { id: "cert26", name: "PTW Procedure Training", expiryDate: "2026-12-01", status: "Valid" },
    ],
  },
  {
    id: "W007", name: "Deepak Nair", role: "Worker", contractorId: "C003",
    photo: "DN", status: "Active",
    certifications: [
      { id: "cert27", name: "Electrical Competency", expiryDate: "2026-06-30", status: "Valid" },
      { id: "cert28", name: "Isolation Training", expiryDate: "2026-06-30", status: "Valid" },
      { id: "cert29", name: "Medical Fitness", expiryDate: "2026-05-15", status: "Valid" },
      { id: "cert30", name: "PTW Procedure Training", expiryDate: "2026-12-01", status: "Valid" },
    ],
  },
  {
    id: "W008", name: "Ravi Tiwari", role: "Worker", contractorId: "C004",
    photo: "RT", status: "Active",
    certifications: [
      { id: "cert31", name: "Working at Height", expiryDate: "2026-02-28", status: "Expiring" },
      { id: "cert32", name: "Harness Inspection", expiryDate: "2025-12-31", status: "Expired" },
      { id: "cert33", name: "Medical Fitness", expiryDate: "2026-08-20", status: "Valid" },
      { id: "cert34", name: "PTW Procedure Training", expiryDate: "2026-10-10", status: "Valid" },
    ],
  },
];

export const mockNCs: NonConformance[] = [
  {
    id: "NC001", permitId: "PTW-2026-00089", control: "Fire watch designated for 30 min post-work",
    severity: "Major", status: "Action Submitted", raisedBy: "Rahul Mehta", raisedAt: "2026-05-18T10:30:00",
    aiConfidence: 92, description: "Fire watch person was absent from post during audit. High-risk situation confirmed.",
    correctiveAction: "Contractor briefed. New fire watch person assigned and posted. Training record updated.",
  },
  {
    id: "NC002", permitId: "PTW-2026-00089", control: "Fire extinguisher present and accessible",
    severity: "Minor", status: "Closed", raisedBy: "Rahul Mehta", raisedAt: "2026-05-18T10:32:00",
    aiConfidence: 88, description: "Extinguisher was present but partially obscured by materials.",
    correctiveAction: "Extinguisher relocated to clear access point.", closedAt: "2026-05-18T14:00:00",
  },
  {
    id: "NC003", permitId: "PTW-2026-00091", control: "Continuous gas monitoring (O₂, LEL, H₂S, CO)",
    severity: "Critical", status: "Open", raisedBy: "Sunita Reddy", raisedAt: "2026-05-19T09:15:00",
    aiConfidence: 95, description: "Gas monitor alarm was disabled. Extremely high-risk — permit auto-suspended.",
    correctiveAction: undefined,
  },
  {
    id: "NC004", permitId: "PTW-2026-00102", control: "Full body harness worn and inspected",
    severity: "Major", status: "Acknowledged", raisedBy: "Kiran Bose", raisedAt: "2026-05-19T11:45:00",
    aiConfidence: 78, description: "Worker observed without harness attached at height. Immediate stop-work issued.",
    correctiveAction: undefined,
  },
];

export const mockAudits: AuditRecord[] = [
  {
    id: "AUD001", permitId: "PTW-2026-00089", auditor: "Rahul Mehta",
    scheduledAt: "2026-05-18T10:00:00", completedAt: "2026-05-18T10:45:00",
    method: "Plan A", outcome: "Non-Compliant", ncs: ["NC001", "NC002"],
    geoCoord: { lat: 19.076, lng: 72.877 },
  },
  {
    id: "AUD002", permitId: "PTW-2026-00091", auditor: "Sunita Reddy",
    scheduledAt: "2026-05-19T09:00:00", completedAt: "2026-05-19T09:30:00",
    method: "Plan A", outcome: "Non-Compliant", ncs: ["NC003"],
    geoCoord: { lat: 19.077, lng: 72.878 },
  },
  {
    id: "AUD003", permitId: "PTW-2026-00096", auditor: "Kiran Bose",
    scheduledAt: "2026-05-20T08:00:00", completedAt: "2026-05-20T08:35:00",
    method: "Plan A", outcome: "Compliant", ncs: [],
    geoCoord: { lat: 19.075, lng: 72.879 },
  },
];

const now = new Date("2026-05-20T08:30:00");
const addHours = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();
const subHours = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

export const mockPermits: Permit[] = [
  {
    id: "p1", number: "HW-2026-00089", type: "Hot Work", status: "Active",
    area: "Boiler Bay — Unit 3", equipment: "BLR-003", jobDescription: "Welding repair on boiler feed water pipe flange connection. Replace corroded gasket and re-weld joint.",
    contractorId: "C001", contractorName: "Apex Industrial Services",
    requestedBy: "Sandeep Kumar (Area In-Charge)", supervisorId: "W001", supervisorName: "Rajesh Kumar",
    workers: mockWorkers.filter(w => ["W001","W002","W003"].includes(w.id)),
    requestDate: subHours(20), plannedStart: subHours(6), plannedEnd: addHours(2),
    approvedAt: subHours(5), expiresAt: addHours(2),
    riskAssessment: {
      hazards: [
        { id: "h1", description: "Fire / explosion from ignition sources", riskLevel: "High", applicable: true },
        { id: "h2", description: "Toxic fumes and smoke inhalation", riskLevel: "Medium", applicable: true },
        { id: "h3", description: "Flash burns / UV radiation", riskLevel: "High", applicable: true },
        { id: "h4", description: "Presence of hydrocarbons or flammables", riskLevel: "High", applicable: true },
        { id: "h5", description: "Electrical hazards near work area", riskLevel: "Low", applicable: false },
      ],
      controls: [
        { id: "c1", description: "Fire extinguisher present and accessible", selected: true, mandatory: true },
        { id: "c2", description: "Fire watch designated for 30 min post-work", selected: true, mandatory: true },
        { id: "c3", description: "Combustibles removed / covered within 10m", selected: true, mandatory: true },
        { id: "c4", description: "Gas testing confirmed clear", selected: true, mandatory: true },
        { id: "c5", description: "Area wetted / fireproof blankets used", selected: true, mandatory: false },
      ],
      requiresIsolation: true, isolationType: "Pipeline isolation — valve + blinding",
      requesterAck: "2026-05-19T21:15:00", supervisorAck: "2026-05-19T21:30:00",
    },
    approvalTrail: [
      { level: 0, person: "Sunita Reddy", designation: "Safety Officer", action: "Cleared", timestamp: subHours(6.5), comments: "Confirmed area cleared of flammables. Gas test result: 0% LEL." },
      { level: 1, person: "Prakash Shenoy", designation: "Area Manager", action: "Approved", timestamp: subHours(6), comments: "Approved. Ensure fire watch is maintained throughout." },
    ],
    operationalEvents: [
      { id: "oe1", type: "Hold", timestamp: subHours(3), reason: "Brief lunch break — all workers exiting area", initiatedBy: "Rajesh Kumar (Supervisor)", resolved: true, resolvedAt: subHours(2.5) },
    ],
    auditRecords: [mockAudits[0]],
    nonConformances: [mockNCs[0], mockNCs[1]],
    dailyLogs: [],
    specialInstructions: "No simultaneous painting operations within 15m. Dedicated fire marshal on standby.",
    workerCount: 3, headcountInside: 3,
  },
  {
    id: "p2", number: "CS-2026-00091", type: "Confined Space", status: "Suspended",
    area: "Effluent Treatment Plant — Tank 2", equipment: "ETP-T2",
    jobDescription: "Internal inspection and cleaning of ETP settling tank. De-sludging and structural assessment.",
    contractorId: "C002", contractorName: "SafeTech Contractors Ltd",
    requestedBy: "Manoj Iyer (ETP In-Charge)", supervisorId: "W004", supervisorName: "Priya Sharma",
    workers: mockWorkers.filter(w => ["W004","W005"].includes(w.id)),
    requestDate: subHours(48), plannedStart: subHours(10), plannedEnd: addHours(6),
    approvedAt: subHours(9), expiresAt: addHours(6),
    riskAssessment: {
      hazards: [
        { id: "h6", description: "Oxygen deficiency or enrichment", riskLevel: "High", applicable: true },
        { id: "h7", description: "Toxic gas (H₂S, CO, etc.)", riskLevel: "High", applicable: true },
        { id: "h8", description: "Flooding / liquid ingress", riskLevel: "High", applicable: true },
        { id: "h9", description: "Restricted exit / entrapment", riskLevel: "High", applicable: true },
      ],
      controls: [
        { id: "c6", description: "Continuous gas monitoring (O₂, LEL, H₂S, CO)", selected: true, mandatory: true },
        { id: "c7", description: "Rescue team on standby", selected: true, mandatory: true },
        { id: "c8", description: "Tripod + lifeline rigged", selected: true, mandatory: true },
        { id: "c9", description: "Ventilation confirmed (16-25% O₂)", selected: true, mandatory: true },
        { id: "c10", description: "Attendant posted outside at all times", selected: true, mandatory: true },
      ],
      requiresIsolation: true, isolationType: "Pipeline disconnection + valve isolation",
      requesterAck: "2026-05-18T07:00:00", supervisorAck: "2026-05-18T07:20:00",
    },
    approvalTrail: [
      { level: 0, person: "Sunita Reddy", designation: "Safety Officer", action: "Conditional Clearance", timestamp: subHours(10.5), conditions: "Mandatory 30-minute pre-entry gas purge. Rescue team to be on standby at all times." },
      { level: 1, person: "Ramesh Gopal", designation: "Plant Manager", action: "Approved with Conditions", timestamp: subHours(10), conditions: "Supervisor must remain at entry point. Max 2 workers inside simultaneously." },
    ],
    operationalEvents: [
      { id: "oe2", type: "Suspend", timestamp: subHours(1), reason: "Critical NC: gas monitor found disabled. Immediate suspension per Safety Officer order.", initiatedBy: "Sunita Reddy (Safety Officer)", resolved: false },
    ],
    auditRecords: [mockAudits[1]],
    nonConformances: [mockNCs[2]],
    dailyLogs: [],
    workerCount: 2, headcountInside: 0,
  },
  {
    id: "p3", number: "EL-2026-00096", type: "Electrical", status: "Active",
    area: "HT Panel Room — Building C", equipment: "HT-PANEL-C3",
    jobDescription: "Replacement of failed circuit breaker in 11kV HT panel. Includes LOTO, bus-bar cleaning and CB testing.",
    contractorId: "C003", contractorName: "Bharat Engineering Works",
    requestedBy: "Vivek Kulkarni (Electrical In-Charge)", supervisorId: "W006", supervisorName: "Amit Verma",
    workers: mockWorkers.filter(w => ["W006","W007"].includes(w.id)),
    requestDate: subHours(30), plannedStart: subHours(4), plannedEnd: addHours(4),
    approvedAt: subHours(4), expiresAt: addHours(4),
    riskAssessment: {
      hazards: [
        { id: "h10", description: "Electric shock / electrocution", riskLevel: "High", applicable: true },
        { id: "h11", description: "Arc flash / arc blast", riskLevel: "High", applicable: true },
        { id: "h12", description: "Inadequate isolation of energy", riskLevel: "High", applicable: true },
      ],
      controls: [
        { id: "c11", description: "LOTO applied and verified", selected: true, mandatory: true },
        { id: "c12", description: "Isolation verified with test instrument", selected: true, mandatory: true },
        { id: "c13", description: "Arc flash PPE worn", selected: true, mandatory: true },
        { id: "c14", description: "Permit displayed at work location", selected: true, mandatory: true },
      ],
      requiresIsolation: true, isolationType: "Lockout/Tagout — 3 energy sources",
      requesterAck: "2026-05-20T04:00:00", supervisorAck: "2026-05-20T04:15:00",
    },
    approvalTrail: [
      { level: 0, person: "Sunita Reddy", designation: "Safety Officer", action: "Cleared", timestamp: subHours(5), comments: "Isolation scheme reviewed and approved." },
      { level: 1, person: "Prakash Shenoy", designation: "Area Manager", action: "Approved", timestamp: subHours(4), comments: "Cleared. Maintain LOTO until final sign-off." },
    ],
    operationalEvents: [],
    auditRecords: [mockAudits[2]],
    nonConformances: [],
    dailyLogs: [],
    workerCount: 2, headcountInside: 2,
  },
  {
    id: "p4", number: "HT-2026-00102", type: "Height Work", status: "Active",
    area: "Cooling Tower — Cell 4 (18m)", equipment: "CT-CELL-4",
    jobDescription: "Replacement of damaged fan blades on top of Cooling Tower Cell 4. Rope access required.",
    contractorId: "C004", contractorName: "Horizon Maintenance Co",
    requestedBy: "Nisha Patel (Utilities Manager)", supervisorId: "W008", supervisorName: "Ravi Tiwari",
    workers: [mockWorkers[7]],
    requestDate: subHours(24), plannedStart: subHours(2), plannedEnd: addHours(6),
    approvedAt: subHours(2), expiresAt: addHours(6),
    riskAssessment: {
      hazards: [
        { id: "h13", description: "Falls from height", riskLevel: "High", applicable: true },
        { id: "h14", description: "Falling objects / tools", riskLevel: "High", applicable: true },
        { id: "h15", description: "Adverse weather conditions", riskLevel: "Medium", applicable: true },
      ],
      controls: [
        { id: "c15", description: "Full body harness worn and inspected", selected: true, mandatory: true },
        { id: "c16", description: "Anchorage point rated min 15kN", selected: true, mandatory: true },
        { id: "c17", description: "Tool tethering for all equipment", selected: true, mandatory: true },
        { id: "c18", description: "Barricading below work zone", selected: true, mandatory: true },
      ],
      requiresIsolation: false,
      requesterAck: "2026-05-20T06:00:00", supervisorAck: "2026-05-20T06:20:00",
    },
    approvalTrail: [
      { level: 1, person: "Prakash Shenoy", designation: "Area Manager", action: "Approved with Conditions", timestamp: subHours(2), conditions: "Wind speed must not exceed 15 knots. Continuous monitoring required." },
    ],
    operationalEvents: [
      { id: "oe3", type: "Periodic Check", timestamp: subHours(1), reason: "Scheduled 1-hour check: harness inspected, conditions OK, no new hazards", initiatedBy: "Ravi Tiwari (Supervisor)", resolved: true, resolvedAt: subHours(0.9) },
    ],
    auditRecords: [],
    nonConformances: [mockNCs[3]],
    dailyLogs: [],
    workerCount: 1, headcountInside: 1,
  },
  {
    id: "p5", number: "HW-2026-00105", type: "Hot Work", status: "Pending Approval",
    area: "Steam Generation Unit — Unit 1", equipment: "SGU-001",
    jobDescription: "Cutting and replacement of steam trap bypass line. Requires hot tapping on live steam line.",
    contractorId: "C001", contractorName: "Apex Industrial Services",
    requestedBy: "Sandeep Kumar (Area In-Charge)", supervisorId: "W001", supervisorName: "Rajesh Kumar",
    workers: mockWorkers.filter(w => ["W001","W003"].includes(w.id)),
    requestDate: subHours(3), plannedStart: addHours(2), plannedEnd: addHours(10),
    riskAssessment: {
      hazards: [
        { id: "h16", description: "Fire / explosion from ignition sources", riskLevel: "High", applicable: true },
        { id: "h17", description: "Toxic fumes and smoke inhalation", riskLevel: "Medium", applicable: true },
        { id: "h18", description: "Flash burns / UV radiation", riskLevel: "High", applicable: true },
      ],
      controls: [
        { id: "c19", description: "Fire extinguisher present and accessible", selected: true, mandatory: true },
        { id: "c20", description: "Fire watch designated for 30 min post-work", selected: true, mandatory: true },
        { id: "c21", description: "Gas testing confirmed clear", selected: true, mandatory: true },
      ],
      requiresIsolation: true, isolationType: "Steam line isolation — valve + spectacle blind",
      requesterAck: subHours(2.5), supervisorAck: subHours(2),
    },
    approvalTrail: [],
    operationalEvents: [],
    auditRecords: [],
    nonConformances: [],
    dailyLogs: [],
    workerCount: 2, headcountInside: 0,
  },
  {
    id: "p6", number: "CS-2026-00107", type: "Confined Space", status: "Under Safety Review",
    area: "Water Treatment Plant — Clarifier 3", equipment: "WTP-CLF-3",
    jobDescription: "Internal coating repair of clarifier tank. Surface preparation and epoxy application.",
    contractorId: "C003", contractorName: "Bharat Engineering Works",
    requestedBy: "Vivek Kulkarni (Electrical In-Charge)", supervisorId: "W006", supervisorName: "Amit Verma",
    workers: mockWorkers.filter(w => ["W006","W007"].includes(w.id)),
    requestDate: subHours(5), plannedStart: addHours(4), plannedEnd: addHours(12),
    riskAssessment: {
      hazards: [
        { id: "h19", description: "Oxygen deficiency or enrichment", riskLevel: "High", applicable: true },
        { id: "h20", description: "Toxic gas (H₂S, CO, etc.)", riskLevel: "High", applicable: true },
        { id: "h21", description: "Flooding / liquid ingress", riskLevel: "Medium", applicable: true },
      ],
      controls: [
        { id: "c22", description: "Continuous gas monitoring (O₂, LEL, H₂S, CO)", selected: true, mandatory: true },
        { id: "c23", description: "Rescue team on standby", selected: true, mandatory: true },
        { id: "c24", description: "Tripod + lifeline rigged", selected: true, mandatory: true },
      ],
      requiresIsolation: true, isolationType: "Pipeline disconnection",
      requesterAck: subHours(4), supervisorAck: subHours(3.5),
    },
    approvalTrail: [],
    operationalEvents: [],
    auditRecords: [],
    nonConformances: [],
    dailyLogs: [],
    workerCount: 2, headcountInside: 0,
  },
  {
    id: "p7", number: "EX-2026-00098", type: "Excavation", status: "Closed",
    area: "Plant Road — Cable Trench C7", equipment: undefined,
    jobDescription: "New underground cable trench excavation for new electrical substation feed. Length 120m, depth 1.5m.",
    contractorId: "C003", contractorName: "Bharat Engineering Works",
    requestedBy: "Vivek Kulkarni (Electrical In-Charge)", supervisorId: "W006", supervisorName: "Amit Verma",
    workers: mockWorkers.filter(w => ["W006","W007"].includes(w.id)),
    requestDate: subHours(96), plannedStart: subHours(72), plannedEnd: subHours(24),
    approvedAt: subHours(73), expiresAt: subHours(24), closedAt: subHours(26),
    riskAssessment: {
      hazards: [
        { id: "h22", description: "Underground utilities / services", riskLevel: "High", applicable: true },
        { id: "h23", description: "Collapse of excavation walls", riskLevel: "High", applicable: true },
      ],
      controls: [
        { id: "c25", description: "Utility services located and marked", selected: true, mandatory: true },
        { id: "c26", description: "Shoring / benching / battered slopes", selected: true, mandatory: true },
        { id: "c27", description: "Barriers and lights at perimeter", selected: true, mandatory: true },
      ],
      requiresIsolation: false,
      requesterAck: subHours(75), supervisorAck: subHours(74.5),
    },
    approvalTrail: [
      { level: 1, person: "Prakash Shenoy", designation: "Area Manager", action: "Approved", timestamp: subHours(73), comments: "Utility survey confirmed. Proceed with caution near legacy service lines." },
    ],
    operationalEvents: [],
    auditRecords: [],
    nonConformances: [],
    dailyLogs: [],
    workerCount: 2, headcountInside: 0,
  },
  {
    id: "p8", number: "HW-2026-00110", type: "Hot Work", status: "Draft",
    area: "Compressor House — Bay 2", equipment: "COMP-02",
    jobDescription: "Replacement of corroded exhaust manifold on natural gas compressor. Requires hot cutting.",
    contractorId: "C001", contractorName: "Apex Industrial Services",
    requestedBy: "Sandeep Kumar (Area In-Charge)", supervisorId: "W001", supervisorName: "Rajesh Kumar",
    workers: [],
    requestDate: subHours(1), plannedStart: addHours(24), plannedEnd: addHours(32),
    riskAssessment: { hazards: [], controls: [], requiresIsolation: false },
    approvalTrail: [],
    operationalEvents: [],
    auditRecords: [],
    nonConformances: [],
    dailyLogs: [],
    workerCount: 0, headcountInside: 0,
  },
];

export const ncTrend = [
  { week: "W1 Apr", minor: 3, major: 1, critical: 0 },
  { week: "W2 Apr", minor: 2, major: 2, critical: 1 },
  { week: "W3 Apr", minor: 4, major: 1, critical: 0 },
  { week: "W4 Apr", minor: 1, major: 3, critical: 0 },
  { week: "W1 May", minor: 5, major: 2, critical: 1 },
  { week: "W2 May", minor: 2, major: 1, critical: 0 },
  { week: "W3 May", minor: 3, major: 2, critical: 1 },
];

export const permitVolume = [
  { month: "Feb", hot: 12, confined: 5, electrical: 8, height: 6, excavation: 4, cold: 15, radiography: 2 },
  { month: "Mar", hot: 15, confined: 7, electrical: 10, height: 9, excavation: 6, cold: 18, radiography: 3 },
  { month: "Apr", hot: 18, confined: 6, electrical: 12, height: 11, excavation: 5, cold: 22, radiography: 2 },
  { month: "May", hot: 14, confined: 9, electrical: 9, height: 8, excavation: 7, cold: 19, radiography: 4 },
];

export const statusDistribution = [
  { name: "Active", value: 3, color: "#6cffa8" },
  { name: "Pending Approval", value: 1, color: "#ffc46c" },
  { name: "Under Safety Review", value: 1, color: "#6c8cff" },
  { name: "Suspended", value: 1, color: "#ff6c8c" },
  { name: "Closed", value: 1, color: "#8a92a6" },
  { name: "Draft", value: 1, color: "#2a3142" },
];

export function getPermitTypeInfo(type: string) {
  return PERMIT_TYPES.find(p => p.value === type) ?? PERMIT_TYPES[0];
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    "Draft":                  "#6A6A6A",
    "Submitted":              "#F58634",
    "Under Safety Review":    "#7C3AED",
    "Pending Approval":       "#D97706",
    "Approved":               "#F58634",
    "Active":                 "#16A34A",
    "Revalidation Required":  "#D97706",
    "Suspended":              "#DC2626",
    "Closed":                 "#6A6A6A",
    "Cancelled":              "#6A6A6A",
    "Rejected":               "#DC2626",
  };
  return map[status] ?? "#6A6A6A";
}

export function getStatusBg(status: string): string {
  const map: Record<string, string> = {
    "Draft":                  "rgba(106,106,106,0.08)",
    "Submitted":              "rgba(245,134,52,0.08)",
    "Under Safety Review":    "rgba(124,58,237,0.08)",
    "Pending Approval":       "rgba(217,119,6,0.08)",
    "Approved":               "rgba(245,134,52,0.08)",
    "Active":                 "rgba(22,163,74,0.08)",
    "Revalidation Required":  "rgba(217,119,6,0.08)",
    "Suspended":              "rgba(220,38,38,0.08)",
    "Closed":                 "rgba(106,106,106,0.08)",
    "Cancelled":              "rgba(106,106,106,0.08)",
    "Rejected":               "rgba(220,38,38,0.08)",
  };
  return map[status] ?? "rgba(106,106,106,0.08)";
}

export function getCountdownClass(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  const pct = ms / (8 * 3600000);
  if (ms < 0) return "countdown-red";
  if (ms < 3600000) return "countdown-red";
  if (pct < 0.3) return "countdown-amber";
  return "countdown-green";
}

export function formatCountdown(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms < 0) return "EXPIRED";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
