export type PermitType =
  | "Hot Work"
  | "Cold Work"
  | "Confined Space"
  | "Excavation"
  | "Electrical"
  | "Height Work"
  | "Radiography";

export type PermitStatus =
  | "Draft"
  | "Submitted"
  | "Under Safety Review"
  | "Pending Approval"
  | "Approved"
  | "Active"
  | "Revalidation Required"
  | "Suspended"
  | "Closed"
  | "Cancelled"
  | "Rejected";

export type RiskLevel = "Low" | "Medium" | "High";
export type NCStatus = "Open" | "Acknowledged" | "Action Submitted" | "Closed" | "Rejected";
export type NCSeverity = "Minor" | "Major" | "Critical";

export interface Certification {
  id: string;
  name: string;
  expiryDate: string;
  status: "Valid" | "Expiring" | "Expired";
}

export interface Worker {
  id: string;
  name: string;
  role: "Worker" | "Supervisor";
  contractorId: string;
  certifications: Certification[];
  status: "Active" | "Suspended" | "Blacklisted";
  photo: string;
}

export interface Contractor {
  id: string;
  name: string;
  status: "Active" | "Suspended";
  scorecard: {
    totalPermits: number;
    totalNCs: number;
    ncRate: number;
    repeatNCs: number;
    closureCompliance: number;
  };
  is17893Status: Record<PermitType, "green" | "amber" | "red">;
}

export interface Hazard {
  id: string;
  description: string;
  riskLevel: RiskLevel;
  applicable: boolean;
}

export interface ControlMeasure {
  id: string;
  description: string;
  selected: boolean;
  mandatory: boolean;
}

export interface RiskAssessment {
  hazards: Hazard[];
  controls: ControlMeasure[];
  requiresIsolation: boolean;
  isolationType?: string;
  requesterAck?: string;
  supervisorAck?: string;
}

export interface ApprovalAction {
  level: number;
  person: string;
  designation: string;
  action: "Approved" | "Rejected" | "Return for Clarification" | "Approved with Conditions" | "Cleared" | "Conditional Clearance";
  timestamp: string;
  comments?: string;
  conditions?: string;
}

export interface NonConformance {
  id: string;
  permitId: string;
  control: string;
  severity: NCSeverity;
  status: NCStatus;
  raisedBy: string;
  raisedAt: string;
  aiConfidence?: number;
  description: string;
  correctiveAction?: string;
  closedAt?: string;
}

export interface AuditRecord {
  id: string;
  permitId: string;
  auditor: string;
  scheduledAt: string;
  completedAt?: string;
  method: "Plan A" | "Plan B" | "Plan C";
  outcome?: "Compliant" | "Non-Compliant" | "Partially Compliant";
  ncs: string[];
  geoCoord?: { lat: number; lng: number };
}

export interface OperationalEvent {
  id: string;
  type: "Hold" | "Suspend" | "Cancel" | "Revalidation" | "Periodic Check" | "Incident" | "Near Miss";
  timestamp: string;
  reason: string;
  initiatedBy: string;
  resolved?: boolean;
  resolvedAt?: string;
}

export interface DailyLog {
  date: string;
  startStatus: string;
  endStatus: string;
  headcount: number;
  hoursWorked: number;
  periodicChecks: number;
  events: OperationalEvent[];
  manualNotes?: string;
}

export interface Permit {
  id: string;
  number: string;
  type: PermitType;
  status: PermitStatus;
  area: string;
  equipment?: string;
  jobDescription: string;
  contractorId: string;
  contractorName: string;
  requestedBy: string;
  supervisorId: string;
  supervisorName: string;
  workers: Worker[];
  requestDate: string;
  plannedStart: string;
  plannedEnd: string;
  approvedAt?: string;
  expiresAt?: string;
  closedAt?: string;
  riskAssessment: RiskAssessment;
  approvalTrail: ApprovalAction[];
  operationalEvents: OperationalEvent[];
  auditRecords: AuditRecord[];
  nonConformances: NonConformance[];
  dailyLogs: DailyLog[];
  specialInstructions?: string;
  workerCount: number;
  headcountInside: number;
}
