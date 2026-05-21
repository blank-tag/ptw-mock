import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";
import { mockContractors, mockWorkers, mockPermits, mockNCs, mockAudits } from "../data/mockData";
import type { Contractor, Worker, Permit, NonConformance, AuditRecord, ApprovalAction, PermitStatus } from "../types";
import { DEFAULT_ROLE, getRoleById, type RoleId, type RolePersona } from "../data/roles";

export interface AppState {
  contractors: Contractor[];
  workers: Worker[];
  permits: Permit[];
  ncs: NonConformance[];
  audits: AuditRecord[];
  roleId: RoleId;
}

export type AppAction =
  | { type: "SET_ROLE"; id: RoleId }
  | { type: "ADD_CONTRACTOR"; payload: Contractor }
  | { type: "UPDATE_CONTRACTOR"; id: string; changes: Partial<Contractor> }
  | { type: "ADD_WORKER"; payload: Worker }
  | { type: "UPDATE_WORKER"; id: string; changes: Partial<Worker> }
  | { type: "ADD_PERMIT"; payload: Permit }
  | { type: "SO_CLEAR_PERMIT"; id: string; soAction: string; conditions?: string; comments?: string }
  | { type: "PROCESS_APPROVAL"; id: string; approvalAction: string; person: string; designation: string; comments?: string; conditions?: string }
  | { type: "CLOSE_PERMIT"; id: string }
  | { type: "WIP_ACTION"; id: string; eventType: "Hold" | "Suspend" | "Cancel"; reason: string; by: string }
  | { type: "RESET" };

function seed(): AppState {
  return {
    contractors: mockContractors,
    workers: mockWorkers,
    permits: mockPermits,
    ncs: mockNCs,
    audits: mockAudits,
    roleId: DEFAULT_ROLE.id,
  };
}

function getInitialState(): AppState {
  try {
    const stored = localStorage.getItem("ptw_store_v2");
    if (stored) return JSON.parse(stored);
  } catch {}
  return seed();
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ROLE":
      return { ...state, roleId: action.id };

    case "ADD_CONTRACTOR":
      return { ...state, contractors: [...state.contractors, action.payload] };

    case "UPDATE_CONTRACTOR":
      return {
        ...state,
        contractors: state.contractors.map(c =>
          c.id === action.id ? { ...c, ...action.changes } : c
        ),
      };

    case "ADD_WORKER":
      return { ...state, workers: [...state.workers, action.payload] };

    case "UPDATE_WORKER":
      return {
        ...state,
        workers: state.workers.map(w =>
          w.id === action.id ? { ...w, ...action.changes } : w
        ),
      };

    case "ADD_PERMIT":
      return { ...state, permits: [action.payload, ...state.permits] };

    case "SO_CLEAR_PERMIT": {
      const entry: ApprovalAction = {
        level: 0,
        person: "Sunita Reddy",
        designation: "Safety Officer",
        action: action.soAction as ApprovalAction["action"],
        timestamp: new Date().toISOString(),
        comments: action.comments,
        conditions: action.conditions,
      };
      return {
        ...state,
        permits: state.permits.map(p =>
          p.id === action.id
            ? { ...p, status: "Pending Approval" as PermitStatus, approvalTrail: [...p.approvalTrail, entry] }
            : p
        ),
      };
    }

    case "PROCESS_APPROVAL": {
      let newStatus: PermitStatus;
      if (action.approvalAction === "Reject") newStatus = "Rejected";
      else if (action.approvalAction === "Return for Clarification") newStatus = "Draft";
      else newStatus = "Active"; // Approve / Approve with Conditions → Active

      const entry: ApprovalAction = {
        level: 1,
        person: action.person,
        designation: action.designation,
        action: action.approvalAction as ApprovalAction["action"],
        timestamp: new Date().toISOString(),
        comments: action.comments,
        conditions: action.conditions,
      };
      return {
        ...state,
        permits: state.permits.map(p =>
          p.id === action.id
            ? {
                ...p,
                status: newStatus,
                approvedAt: newStatus === "Active" ? new Date().toISOString() : p.approvedAt,
                expiresAt: newStatus === "Active" ? new Date(Date.now() + 8 * 3600000).toISOString() : p.expiresAt,
                approvalTrail: [...p.approvalTrail, entry],
              }
            : p
        ),
      };
    }

    case "CLOSE_PERMIT":
      return {
        ...state,
        permits: state.permits.map(p =>
          p.id === action.id
            ? { ...p, status: "Closed" as PermitStatus, closedAt: new Date().toISOString() }
            : p
        ),
      };

    case "WIP_ACTION": {
      const newStatus: PermitStatus =
        action.eventType === "Cancel" ? "Cancelled"
        : action.eventType === "Suspend" ? "Suspended"
        : "Active";
      const ev = {
        id: `oe-${Date.now()}`,
        type: action.eventType,
        timestamp: new Date().toISOString(),
        reason: action.reason,
        initiatedBy: action.by,
        resolved: action.eventType === "Hold",
      };
      return {
        ...state,
        permits: state.permits.map(p =>
          p.id === action.id
            ? { ...p, status: newStatus, operationalEvents: [...p.operationalEvents, ev] }
            : p
        ),
      };
    }

    case "RESET":
      return seed();

    default:
      return state;
  }
}

interface StoreCtx {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  role: RolePersona;
}

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  useEffect(() => {
    try { localStorage.setItem("ptw_store_v2", JSON.stringify(state)); } catch {}
  }, [state]);

  const role = getRoleById(state.roleId);

  return (
    <StoreContext.Provider value={{ state, dispatch, role }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreCtx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}

export function genPermitNumber(type: string, permits: Permit[]): string {
  const prefix = type.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const year = new Date().getFullYear();
  const nums = permits
    .filter(p => p.number.startsWith(`${prefix}-${year}-`))
    .map(p => parseInt(p.number.split("-").pop() || "0"))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 111;
  return `${prefix}-${year}-${String(next).padStart(5, "0")}`;
}
