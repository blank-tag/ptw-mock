import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle, XCircle, ChevronRight, ChevronLeft, Shield, Info, Upload, X } from "lucide-react";
import { PERMIT_TYPES, CERT_MAPPING, HAZARD_LIBRARY, CONTROL_LIBRARY } from "../../data/mockData";
import type { PermitType, Permit, Hazard, ControlMeasure } from "../../types";
import { useStore, genPermitNumber } from "../../store/AppStore";

const STEPS = ["Permit Type", "Job Details", "Workers", "Checklist", "Approval Flow", "Site Photos", "Acknowledgement", "Submit"];

const PLANTS = ["Boiler Bay", "Steam Generation Unit", "ETP", "HT Panel Room", "Compressor House", "Cooling Tower", "Water Treatment Plant", "Utility Block", "Warehouse"];
const ISOLATION_OPTIONS = ["Lockout / Tagout (LOTO)", "Valve isolation", "Spectacle blind / blinding", "Mechanical blocking", "Pipeline disconnection", "Steam line isolation"];

// IS 17893 §2.3 — Nature of Job sub-types per permit type
const JOB_NATURE_OPTIONS: Record<string, string[]> = {
  "Hot Work": ["Welding", "Cutting / Grinding", "Flame Cutting", "Painting / Coating", "Tapping / Drilling", "Cable Laying", "Soldering / Brazing", "Other Hot Process"],
  "Confined Space": ["Inspection / Survey", "Cleaning / Desilting", "Maintenance / Repair", "Installation", "Rescue / Recovery"],
  "Electrical": ["Isolation / LOTO Work", "Cable Work", "Panel / Switchgear Maintenance", "Motor / Transformer Work", "Testing / Commissioning"],
  "Excavation": ["Trenching", "Pit Excavation", "Foundation Work", "Pipeline Laying", "Cable Ducting"],
  "Height Work": ["Scaffolding Work", "Roof / Elevated Access", "Crane / Lift Operations", "Painting / Coating at Height", "Equipment Inspection", "Equipment Installation"],
  "Radiography": ["NDT Radiography", "Gamma Ray Testing", "X-Ray Inspection"],
  "Cold Work": ["Inspection", "Housekeeping / Cleaning", "Equipment Maintenance", "Painting / Cleaning", "Other Cold Process"],
};

// IS 17893 §2.5 — Default validity periods per permit type
const VALIDITY_DEFAULTS: Record<string, string> = {
  "Hot Work": "8 hours",
  "Confined Space": "1 shift (8 hrs)",
  "Electrical": "1 day",
  "Height Work": "1 day",
  "Excavation": "7 days",
  "Cold Work": "7 days",
  "Radiography": "1 shift (8 hrs)",
};

// IS 17893 — Pre-work verification checklist per permit type
// These are formal Yes/No sign-off items confirming site conditions are ready before work starts
// Distinct from risk assessment (hazard rating) and control measures (what to do)
const PREWORK_CHECKLIST: Record<string, { id: string; text: string; note?: string; critical?: boolean }[]> = {
  "Hot Work": [
    { id: "hw1", text: "Work area cleared of combustible / flammable materials within 10 m radius", critical: true },
    { id: "hw2", text: "LEL gas test conducted and result confirmed < 10% LEL", note: "Record reading in notes", critical: true },
    { id: "hw3", text: "Charged fire extinguisher placed at work site and operative", critical: true },
    { id: "hw4", text: "All drain openings / floor sumps / pits within 10 m sealed", critical: true },
    { id: "hw5", text: "Fire watch person identified, briefed and in position", critical: true },
    { id: "hw6", text: "All workers wearing appropriate hot work PPE (welding shield, gloves, fire retardant clothing)" },
    { id: "hw7", text: "Barricading and hot work warning signage placed around work zone" },
    { id: "hw8", text: "Spark / slag deflectors and fire blankets positioned" },
  ],
  "Confined Space": [
    { id: "cs1", text: "Atmospheric test completed — O₂: 16–25%, LEL < 10%, H₂S < 10 ppm, CO < 25 ppm", note: "Record all four readings", critical: true },
    { id: "cs2", text: "Mechanical ventilation running and confirmed effective before entry", critical: true },
    { id: "cs3", text: "Rescue team on standby with rescue equipment available", critical: true },
    { id: "cs4", text: "Tripod, lifeline, and harness rigged and inspected", critical: true },
    { id: "cs5", text: "Attendant posted outside — confirmed will not enter under any circumstances", critical: true },
    { id: "cs6", text: "Entry / exit log started and being maintained" },
    { id: "cs7", text: "All energy sources to confined space isolated and locked out" },
    { id: "cs8", text: "Emergency response plan briefed to all workers and rescue team" },
  ],
  "Electrical": [
    { id: "el1", text: "All energy sources isolated and LOTO applied — isolation certificate issued", critical: true },
    { id: "el2", text: "Isolation verified with calibrated test instrument — zero energy confirmed", critical: true },
    { id: "el3", text: "Arc flash boundary established, posted and barricaded", critical: true },
    { id: "el4", text: "Arc flash PPE (arc rated clothing, face shield, gloves) available and worn" },
    { id: "el5", text: "First aid kit and AED accessible within 30 metres" },
    { id: "el6", text: "Barricading and electrical hazard signage placed at all access points" },
  ],
  "Height Work": [
    { id: "ht1", text: "Full body harness inspected (pre-use check) and worn by all workers at height", critical: true },
    { id: "ht2", text: "Anchorage points rated minimum 15 kN — verified before use", critical: true },
    { id: "ht3", text: "All hand tools and equipment tethered / secured against falling", critical: true },
    { id: "ht4", text: "Scaffold / working platform inspected and green tag / inspection label affixed" },
    { id: "ht5", text: "Barricading and signage below work zone — pedestrian access prevented" },
    { id: "ht6", text: "Weather conditions acceptable (wind speed within limits, no rain / lightning)" },
    { id: "ht7", text: "Workers medically fit and not on medication affecting balance or alertness" },
  ],
  "Excavation": [
    { id: "ex1", text: "Underground utilities / services located, marked and communicated to workers", critical: true },
    { id: "ex2", text: "Shoring, benching or adequately battered slopes in place before entry", critical: true },
    { id: "ex3", text: "Gas test conducted prior to any entry and result confirmed safe", critical: true },
    { id: "ex4", text: "Barriers, lights and warning signs placed at excavation perimeter" },
    { id: "ex5", text: "Spoil placed minimum 600 mm from excavation edge" },
    { id: "ex6", text: "Safe means of egress (ladder / ramp) at maximum 7.5 m intervals" },
    { id: "ex7", text: "Dewatering pump in place and operational (if water ingress risk exists)" },
  ],
  "Cold Work": [
    { id: "cw1", text: "Work area inspected — slip / trip / falling object hazards identified and removed" },
    { id: "cw2", text: "Required PPE issued, inspected and worn by all workers" },
    { id: "cw3", text: "Work area adequately lit and ventilated" },
    { id: "cw4", text: "Clear access maintained to emergency exits and fire fighting equipment" },
  ],
  "Radiography": [
    { id: "rd1", text: "Exclusion zone established, manned 360° and minimum distances confirmed per source activity", critical: true },
    { id: "rd2", text: "Warning signs posted at ALL access points to exclusion zone", critical: true },
    { id: "rd3", text: "Radiation survey conducted prior to work — background levels recorded", critical: true },
    { id: "rd4", text: "All personnel in zone wearing calibrated TLD / dosimeter badges", critical: true },
    { id: "rd5", text: "Source registered in source log and transport container inspected" },
    { id: "rd6", text: "Radiation Safety Officer (RSO) contact confirmed and available on call" },
    { id: "rd7", text: "Emergency response procedures (source stuck, dropped, lost) briefed to team" },
  ],
};

const CONTROL_CATEGORIES: Record<string, { label: string; icon: string; controls: string[] }[]> = {
  "Hot Work": [
    { label: "Fire Safety", icon: "🔥", controls: ["Fire extinguisher present and accessible", "Fire watch designated for 30 min post-work", "Combustibles removed / covered within 10m"] },
    { label: "Gas & Atmosphere", icon: "🌬️", controls: ["Gas testing confirmed clear"] },
    { label: "Documentation", icon: "📋", controls: ["Hot work completion form signed"] },
    { label: "Additional Controls", icon: "🛡️", controls: ["Area wetted / fireproof blankets used"] },
  ],
  "Confined Space": [
    { label: "Gas Monitoring", icon: "🌬️", controls: ["Continuous gas monitoring (O₂, LEL, H₂S, CO)", "Ventilation confirmed (16-25% O₂)"] },
    { label: "Emergency Readiness", icon: "🚨", controls: ["Rescue team on standby", "Tripod + lifeline rigged", "Attendant posted outside at all times"] },
    { label: "Access Control", icon: "📋", controls: ["Entry/exit log maintained"] },
  ],
  "Electrical": [
    { label: "Isolation (LOTO)", icon: "⚡", controls: ["LOTO applied and verified", "Isolation verified with test instrument"] },
    { label: "PPE", icon: "🧤", controls: ["Arc flash PPE worn"] },
    { label: "Site Management", icon: "🚧", controls: ["Permit displayed at work location", "Barricading and signage in place"] },
  ],
  "Height Work": [
    { label: "Fall Protection", icon: "🪢", controls: ["Full body harness worn and inspected", "Anchorage point rated min 15kN"] },
    { label: "Equipment Safety", icon: "🔧", controls: ["Tool tethering for all equipment", "Scaffold inspected and tagged"] },
    { label: "Area Control", icon: "🚧", controls: ["Barricading below work zone"] },
  ],
  "Excavation": [
    { label: "Ground Control", icon: "🏗️", controls: ["Utility services located and marked", "Shoring / benching / battered slopes"] },
    { label: "Safety Barriers", icon: "⚠️", controls: ["Barriers and lights at perimeter", "Spoil placed >600mm from edge"] },
    { label: "Gas Testing", icon: "🌬️", controls: ["Gas testing before entry"] },
  ],
  "Cold Work": [
    { label: "Site Inspection", icon: "👁️", controls: ["Area inspected for hazards"] },
    { label: "PPE & Housekeeping", icon: "🧤", controls: ["Required PPE issued and worn", "Housekeeping maintained"] },
  ],
  "Radiography": [
    { label: "Radiation Control", icon: "☢️", controls: ["Exclusion zone established and manned", "Radiation survey conducted pre-work"] },
    { label: "Source Management", icon: "🔒", controls: ["Source secured when not in use"] },
    { label: "Documentation", icon: "📋", controls: ["Warning signs posted", "TLD badges worn by all personnel"] },
  ],
};

const APPROVAL_CHAIN: Record<string, { role: string; designation: string; action: string; color: string; certReq: string; note?: string }[]> = {
  "Hot Work": [
    { role: "Requester", designation: "Work Initiator / PTW Originator", action: "Submit & Acknowledge", color: "#F58634", certReq: "PTW Procedure Training" },
    { role: "Safety Officer", designation: "HSE Officer / Safety Dept", action: "Fire Safety Clearance", color: "#16A34A", certReq: "HSE Certification", note: "Verifies gas testing, fire watch, area clearance — IS 17893 §3.6" },
    { role: "Approver", designation: "Area In-Charge / Factory Manager", action: "Permit Approval & Issue", color: "#D97706", certReq: "Issuing Authority Designation" },
    { role: "Gate Guard", designation: "Site Access Controller", action: "On-site Activation", color: "#6A6A6A", certReq: "Gate Access Authority" },
  ],
  "Confined Space": [
    { role: "Requester", designation: "Work Initiator / PTW Originator", action: "Submit & Acknowledge", color: "#F58634", certReq: "Confined Space Entry · PTW Training" },
    { role: "Safety Officer", designation: "HSE Officer / Gas Testing Authority", action: "Atmospheric + Rescue Clearance", color: "#16A34A", certReq: "HSE Cert · Gas Testing Auth", note: "Verifies O₂ levels, rescue standby, lifeline — IS 17893 §5.3" },
    { role: "Approver", designation: "Area In-Charge", action: "Permit Approval", color: "#D97706", certReq: "Issuing Authority Designation" },
    { role: "Factory Manager", designation: "Factory Manager / SHE Head", action: "Mandatory Countersign", color: "#7C3AED", certReq: "Senior Authority", note: "IS 17893 §5.4 — Confined Space must be countersigned by SHE Head" },
    { role: "Gate Guard", designation: "Site Access Controller", action: "On-site Activation", color: "#6A6A6A", certReq: "Gate Access Authority" },
  ],
  "Radiography": [
    { role: "Requester", designation: "Work Initiator / PTW Originator", action: "Submit & Acknowledge", color: "#F58634", certReq: "Radiography Op Cert · PTW Training" },
    { role: "Safety Officer", designation: "Radiation Safety Officer (RSO)", action: "Radiation Safety Review", color: "#16A34A", certReq: "RSO Certification · Radiation Safety", note: "Verifies exclusion zone, dosimetry, source control — IS 17893 §5.9" },
    { role: "Approver", designation: "Area In-Charge", action: "Permit Approval", color: "#D97706", certReq: "Issuing Authority Designation" },
    { role: "Factory Manager", designation: "Factory Manager / SHE Head", action: "Mandatory Countersign", color: "#7C3AED", certReq: "Senior Authority", note: "IS 17893 §5.9 — Radiography requires mandatory SHE Head countersign" },
    { role: "Gate Guard", designation: "Site Access Controller", action: "On-site Activation", color: "#6A6A6A", certReq: "Gate Access Authority" },
  ],
  "Electrical": [
    { role: "Requester", designation: "Performing Authority / PTW Originator", action: "Submit & Acknowledge", color: "#F58634", certReq: "Electrical Competency · PTW Training" },
    { role: "Safety Officer", designation: "Electrical Safety Authority", action: "LOTO + Isolation Verification", color: "#16A34A", certReq: "Electrical Safety Auth", note: "Verifies LOTO, isolation certificate, arc flash — IS 17893 §5.5" },
    { role: "Approver", designation: "Area In-Charge / Electrical Manager", action: "Permit Approval & Issue", color: "#D97706", certReq: "Issuing Authority Designation" },
    { role: "Gate Guard", designation: "Site Access Controller", action: "On-site Activation", color: "#6A6A6A", certReq: "Gate Access Authority" },
  ],
  "Height Work": [
    { role: "Requester", designation: "Work Initiator / PTW Originator", action: "Submit & Acknowledge", color: "#F58634", certReq: "Working at Height · PTW Training" },
    { role: "Safety Officer", designation: "HSE Officer / Safety Dept", action: "Fall Protection Verification", color: "#16A34A", certReq: "HSE Certification", note: "Verifies harness inspection, anchorage, barricading — IS 17893 §5.6" },
    { role: "Approver", designation: "Area In-Charge", action: "Permit Approval & Issue", color: "#D97706", certReq: "Issuing Authority Designation" },
    { role: "Gate Guard", designation: "Site Access Controller", action: "On-site Activation", color: "#6A6A6A", certReq: "Gate Access Authority" },
  ],
  "Excavation": [
    { role: "Requester", designation: "Work Initiator / PTW Originator", action: "Submit & Acknowledge", color: "#F58634", certReq: "Excavation Safety · PTW Training" },
    { role: "Safety Officer", designation: "HSE Officer / Safety Dept", action: "Ground Hazard Clearance", color: "#16A34A", certReq: "HSE Certification", note: "Verifies utility marking, shoring, gas testing — IS 17893 §5.7" },
    { role: "Approver", designation: "Area In-Charge", action: "Permit Approval & Issue", color: "#D97706", certReq: "Issuing Authority Designation" },
    { role: "Gate Guard", designation: "Site Access Controller", action: "On-site Activation", color: "#6A6A6A", certReq: "Gate Access Authority" },
  ],
  "Cold Work": [
    { role: "Requester", designation: "Work Initiator / PTW Originator", action: "Submit & Acknowledge", color: "#F58634", certReq: "Basic Safety Training · PTW Training" },
    { role: "Approver", designation: "Area In-Charge", action: "Permit Approval & Issue", color: "#D97706", certReq: "Issuing Authority Designation", note: "IS 17893 §4.2 — Cold Work goes direct to approver, no mandatory SO review" },
    { role: "Gate Guard", designation: "Site Access Controller", action: "On-site Activation", color: "#6A6A6A", certReq: "Gate Access Authority" },
  ],
};

const PHOTO_CATEGORIES = [
  { id: "area", label: "Work Area Overview", desc: "Wide shot showing the full work area and surroundings", required: true, icon: "📸" },
  { id: "equipment", label: "Equipment / Asset Tag", desc: "Close-up of the equipment tag or asset identification plate", required: true, icon: "🏷️" },
  { id: "access", label: "Access Route / Entry Point", desc: "The path workers will use to reach the work area", required: true, icon: "🚪" },
  { id: "isolation", label: "Isolation / LOTO Evidence", desc: "LOTO tags, blinds, valve positions, or isolation proof", required: false, icon: "🔒" },
  { id: "additional", label: "Additional Evidence", desc: "Any other relevant site photographs", required: false, icon: "📎" },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div className={`step-dot ${i < current ? "done" : i === current ? "active" : "idle"}`}>
              {i < current ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span style={{ fontSize: "0.6rem", color: i === current ? "#F58634" : i < current ? "#16A34A" : "#6A6A6A", whiteSpace: "nowrap", fontWeight: 600 }}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line ${i < current ? "done" : ""}`} style={{ margin: "0 4px", marginBottom: 18 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Permit Type ──────────────────────────────────────────────────────

function Step1({ selected, onSelect }: { selected: string; onSelect: (t: string) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>Select Permit Type</h2>
      <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginBottom: "1.5rem" }}>
        7 IS 17893 standard types. Pre-loaded mandatory certifications apply automatically.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.75rem" }}>
        {PERMIT_TYPES.map(pt => (
          <button
            key={pt.value}
            onClick={() => onSelect(pt.value)}
            style={{
              background: selected === pt.value ? `${pt.color}15` : "#F9FAFB",
              border: `1px solid ${selected === pt.value ? pt.color : "#E5E7EB"}`,
              borderRadius: 10, padding: "1.2rem 1rem", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{pt.icon}</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: selected === pt.value ? pt.color : "#2C2C2C" }}>{pt.value}</div>
            <div style={{ fontSize: "0.7rem", color: "#6A6A6A", marginTop: 4 }}>
              {CERT_MAPPING[pt.value]?.length || 0} mandatory certs · IS 17893
            </div>
            <div style={{ fontSize: "0.62rem", color: "#9CA3AF", marginTop: 2 }}>
              {(APPROVAL_CHAIN[pt.value] || []).length} approvals required
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <div style={{ marginTop: "1.25rem", padding: "0.9rem 1rem", background: "rgba(245,134,52,0.06)", border: "1px solid rgba(245,134,52,0.15)", borderRadius: 8 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F58634", marginBottom: 6 }}>
            <Info size={12} style={{ display: "inline", marginRight: 4 }} />
            IS 17893 mandatory certifications for {selected}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CERT_MAPPING[selected]?.map(cert => (
              <span key={cert} style={{ fontSize: "0.7rem", background: "rgba(245,134,52,0.1)", color: "#F58634", border: "1px solid rgba(245,134,52,0.2)", borderRadius: 4, padding: "2px 8px" }}>{cert}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Job Details ──────────────────────────────────────────────────────

// Internal employees who can receive / be issued a permit
const INTERNAL_ISSUEES = [
  "Mohammed Al-Rashid — Area In-Charge, Boiler Section",
  "Priya Sharma — Area In-Charge, Utility Block",
  "Ravi Menon — Shift Supervisor, Production",
  "Anita Nair — Safety Manager, HSE Dept",
  "Suresh Pillai — Maintenance Supervisor",
  "Deepak Joshi — Electrical Supervisor",
  "Kavitha Reddy — Operations Supervisor",
];

function Step2({ form, permitType, contractors, onChange }: {
  form: Record<string, string>;
  permitType: string;
  contractors: { id: string; name: string }[];
  onChange: (k: string, v: string) => void;
}) {
  const natureOptions = JOB_NATURE_OPTIONS[permitType] || [];
  const validityDefault = VALIDITY_DEFAULTS[permitType];

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>Job Particulars</h2>
      <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginBottom: "1.5rem" }}>IS 17893 §4.1.1 — All starred fields mandatory.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Plant / Facility */}
        <div>
          <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 5 }}>Plant / Facility *</label>
          <select value={form.plant || ""} onChange={e => onChange("plant", e.target.value)}>
            <option value="">Select plant…</option>
            {PLANTS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Area / Section */}
        <div>
          <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 5 }}>Area / Section *</label>
          <input value={form.area || ""} onChange={e => onChange("area", e.target.value)} placeholder="e.g. Unit 3, Bay 2…" />
        </div>

        {/* Person Issued To — §4.1.1 requirement */}
        <div>
          <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 5 }}>
            Person Issued To *
            <span style={{ fontSize: "0.62rem", color: "#6A6A6A", fontWeight: 400, marginLeft: 6 }}>§4.1.1 — Internal authority only</span>
          </label>
          <select value={form.issuedTo || ""} onChange={e => onChange("issuedTo", e.target.value)}>
            <option value="">Select issuing authority…</option>
            {INTERNAL_ISSUEES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Nature of Job — §2.3 */}
        <div>
          <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 5 }}>
            Nature of Job *
            <span style={{ fontSize: "0.62rem", color: "#6A6A6A", fontWeight: 400, marginLeft: 6 }}>§2.3 — Determines precautions</span>
          </label>
          {natureOptions.length > 0 ? (
            <select value={form.jobNature || ""} onChange={e => onChange("jobNature", e.target.value)}>
              <option value="">Select job nature…</option>
              {natureOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : (
            <input value={form.jobNature || ""} onChange={e => onChange("jobNature", e.target.value)} placeholder="Describe nature of job…" />
          )}
        </div>

        {/* Equipment Tag */}
        <div>
          <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 5 }}>Equipment Tag</label>
          <input value={form.equipment || ""} onChange={e => onChange("equipment", e.target.value)} placeholder="e.g. BLR-003" />
        </div>

        {/* Contractor Company */}
        <div>
          <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 5 }}>
            Contractor Company *
            {contractors.length === 0 && (
              <span style={{ color: "#DC2626", fontWeight: 400, marginLeft: 6 }}>No contractors — ask Factory Admin to add one first</span>
            )}
          </label>
          <select value={form.contractorId || ""} onChange={e => onChange("contractorId", e.target.value)}>
            <option value="">Select contractor…</option>
            {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Planned Start + End with validity hint */}
        <div>
          <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 5 }}>Planned Start *</label>
          <input type="datetime-local" value={form.start || ""} onChange={e => onChange("start", e.target.value)} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600 }}>Planned End *</label>
            {validityDefault && (
              <span style={{ fontSize: "0.6rem", background: "rgba(245,134,52,0.1)", color: "#F58634", border: "1px solid rgba(245,134,52,0.25)", borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>
                IS 17893 max: {validityDefault}
              </span>
            )}
          </div>
          <input type="datetime-local" value={form.end || ""} onChange={e => onChange("end", e.target.value)} />
        </div>

        {/* Validity guidance banner */}
        {validityDefault && form.start && form.end && (() => {
          const diffMs = new Date(form.end).getTime() - new Date(form.start).getTime();
          const diffHrs = diffMs / (1000 * 3600);
          const maxHrs: Record<string, number> = {
            "Hot Work": 8, "Confined Space": 8, "Radiography": 8,
            "Electrical": 24, "Height Work": 24, "Excavation": 168, "Cold Work": 168,
          };
          const maxH = maxHrs[permitType];
          const over = maxH && diffHrs > maxH;
          if (!over) return null;
          return (
            <div style={{ gridColumn: "1 / -1", padding: "0.6rem 0.85rem", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, fontSize: "0.73rem", color: "#DC2626", display: "flex", gap: 8, alignItems: "center" }}>
              <AlertTriangle size={13} />
              Planned duration ({diffHrs.toFixed(1)} hrs) exceeds IS 17893 max for {permitType} ({validityDefault}). Safety Officer override required at approval.
            </div>
          );
        })()}

        {/* Job Description */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 5 }}>Job Description *</label>
          <textarea value={form.description || ""} onChange={e => onChange("description", e.target.value)} rows={3} placeholder="Describe the work to be performed…" />
        </div>

        {/* Special Instructions */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontSize: "0.75rem", color: "#6A6A6A", fontWeight: 600, display: "block", marginBottom: 5 }}>Special Instructions / Permit Limitations</label>
          <textarea value={form.instructions || ""} onChange={e => onChange("instructions", e.target.value)} rows={2} placeholder="Any special conditions or limitations…" />
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Workers (AI Recommend) ──────────────────────────────────────────

const AI_REASONS: Record<string, string[]> = {
  Supervisor: [
    "Supervised 12 similar permits in the last 90 days with zero NCs",
    "All certifications current — no expiry within 30 days",
    "Highest closure compliance rate (98%) in contractor cohort",
  ],
  Worker: [
    "Full certification match for this permit type",
    "No safety incidents in last 6 months",
    "Previously assigned to 8 similar jobs — zero violations",
  ],
};

function AIRecommendPanel({ workers, requiredCerts, contractorName, selected, onToggle, onClose }: {
  workers: { id: string; name: string; role: string; photo: string; certifications: { name: string; status: string }[] }[];
  requiredCerts: string[];
  contractorName: string;
  selected: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const scored = workers
    .map(w => {
      const validCount = requiredCerts.filter(rc => w.certifications.find(c => c.name === rc && c.status === "Valid")).length;
      const score = (validCount / Math.max(requiredCerts.length, 1)) * 100 + (w.role === "Supervisor" ? 20 : 0);
      return { ...w, score, validCount };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(3, workers.length));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,134,52,0.1)", border: "1px solid rgba(245,134,52,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "1.1rem" }}>✨</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#2C2C2C" }}>AI Worker Recommendations</div>
            <div style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>Ranked by certification match, safety record & permit history · {contractorName}</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {scored.map((w, rank) => {
            const isSelected = selected.includes(w.id);
            const reasons = AI_REASONS[w.role] ?? AI_REASONS.Worker;
            const matchPct = Math.round(w.score > 100 ? 100 : w.score);
            return (
              <div key={w.id} style={{ border: `1px solid ${rank === 0 ? "rgba(245,134,52,0.35)" : "#E5E7EB"}`, borderRadius: 10, padding: "0.9rem 1rem", background: rank === 0 ? "rgba(245,134,52,0.03)" : "#FAFAFA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  {rank === 0 && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "#F58634", color: "#fff", borderRadius: 4, padding: "2px 6px", letterSpacing: 0.5 }}>TOP PICK</span>
                  )}
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(245,134,52,0.1)", border: "1px solid rgba(245,134,52,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#F58634" }}>{w.photo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2C2C2C" }}>{w.name}</div>
                    <div style={{ fontSize: "0.68rem", color: "#6A6A6A" }}>{w.role}</div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 8 }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: matchPct >= 90 ? "#16A34A" : matchPct >= 60 ? "#D97706" : "#DC2626" }}>{matchPct}%</div>
                    <div style={{ fontSize: "0.6rem", color: "#6A6A6A" }}>match</div>
                  </div>
                  <button onClick={() => onToggle(w.id)} className={`btn btn-sm ${isSelected ? "btn-danger" : "btn-primary"}`}>
                    {isSelected ? "Remove" : "Add"}
                  </button>
                </div>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {reasons.map((r, i) => (
                    <li key={i} style={{ fontSize: "0.7rem", color: "#6A6A6A", marginBottom: 2 }}>{r}</li>
                  ))}
                </ul>
                {w.validCount < requiredCerts.length && (
                  <div style={{ marginTop: 8, fontSize: "0.68rem", color: "#D97706", display: "flex", alignItems: "center", gap: 4, background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 6, padding: "4px 8px" }}>
                    <AlertTriangle size={10} /> Missing {requiredCerts.length - w.validCount} required cert(s) — proceed with caution
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { scored.filter(w => !selected.includes(w.id)).forEach(w => onToggle(w.id)); onClose(); }}>
            ✨ Add All Recommended ({scored.length})
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Step3({ permitType, contractorId, selected, workers, contractors, onToggle }: {
  permitType: string;
  contractorId: string;
  selected: string[];
  workers: { id: string; name: string; role: string; contractorId: string; photo: string; certifications: { name: string; status: string; expiryDate: string }[] }[];
  contractors: { id: string; name: string }[];
  onToggle: (id: string) => void;
}) {
  const [showAI, setShowAI] = useState(false);
  const requiredCerts = CERT_MAPPING[permitType] || [];
  const contractorWorkers = contractorId ? workers.filter(w => w.contractorId === contractorId) : workers;
  const contractorName = contractors.find(c => c.id === contractorId)?.name || "—";

  function getFailures(worker: typeof workers[0]) {
    const fails: string[] = [];
    requiredCerts.forEach(cert => {
      const c = worker.certifications.find(wc => wc.name === cert);
      if (!c) fails.push(`${cert} — not found`);
      else if (c.status === "Expired") fails.push(`${cert} — expired (${c.expiryDate})`);
    });
    return fails;
  }

  const selectedWorkers = contractorWorkers.filter(w => selected.includes(w.id));
  const certWarnings = selectedWorkers.filter(w => getFailures(w).length > 0);
  const allValid = certWarnings.length === 0;

  if (!contractorId) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#6A6A6A" }}>
        <AlertTriangle size={32} style={{ margin: "0 auto 12px" }} color="#D97706" />
        <div>Select a contractor in Step 2 first</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Assign Workers</h2>
        {contractorWorkers.length > 0 && (
          <button
            onClick={() => setShowAI(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(245,134,52,0.4)", background: "rgba(245,134,52,0.06)", color: "#F58634", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
          >
            <span>✨</span> Recommend Me Workers
          </button>
        )}
      </div>
      <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginBottom: "1.25rem" }}>
        Select workers for this permit. Certification gaps will be flagged as warnings — you can still proceed.
      </p>
      <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(245,134,52,0.06)", border: "1px solid rgba(245,134,52,0.2)", borderRadius: 8, fontSize: "0.75rem", color: "#6A6A6A" }}>
        Contractor: <strong style={{ color: "#F58634" }}>{contractorName}</strong> ·
        Required certs for <strong style={{ color: "#F58634" }}>{permitType}</strong>: {requiredCerts.join(" · ")}
      </div>

      {contractorWorkers.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", background: "#F9FAFB", borderRadius: 10, color: "#6A6A6A" }}>
          <AlertTriangle size={28} style={{ margin: "0 auto 10px" }} color="#D97706" />
          <div style={{ fontWeight: 600, color: "#D97706", marginBottom: 4 }}>No workers registered for {contractorName}</div>
          <div style={{ fontSize: "0.78rem" }}>Switch to Contractor Supervisor role and add workers in the Contractor Portal, or ask Factory Admin to add workers in Admin Panel.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {contractorWorkers.map(worker => {
            const fails = getFailures(worker);
            const isSelected = selected.includes(worker.id);
            const hasIssues = fails.length > 0;
            return (
              <div key={worker.id} style={{ background: "#F9FAFB", border: `1px solid ${isSelected ? (hasIssues ? "#D97706" : "#16A34A") : "#E5E7EB"}`, borderRadius: 8, padding: "0.9rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: hasIssues ? "rgba(217,119,6,0.1)" : "rgba(22,163,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: hasIssues ? "#D97706" : "#16A34A", border: `1px solid ${hasIssues ? "rgba(217,119,6,0.25)" : "rgba(22,163,74,0.2)"}`, flexShrink: 0 }}>
                      {worker.photo}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2C2C2C" }}>{worker.name}</div>
                      <div style={{ fontSize: "0.72rem", color: worker.role === "Supervisor" ? "#D97706" : "#6A6A6A" }}>{worker.role} · {contractorName}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {!hasIssues ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "#16A34A" }}><CheckCircle size={12} /> All certs valid</span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "#D97706" }}><AlertTriangle size={12} /> {fails.length} cert issue(s)</span>
                    )}
                    <button onClick={() => onToggle(worker.id)} className={`btn btn-sm ${isSelected ? "btn-danger" : "btn-success"}`}>
                      {isSelected ? "Remove" : "Add"}
                    </button>
                  </div>
                </div>
                {fails.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(217,119,6,0.15)" }}>
                    {fails.map((f, i) => (
                      <div key={i} style={{ fontSize: "0.7rem", color: "#D97706", display: "flex", alignItems: "center", gap: 4 }}>
                        <AlertTriangle size={10} /> {f}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {worker.certifications.map((cert, ci) => (
                    <span key={ci} style={{ fontSize: "0.64rem", padding: "1px 7px", borderRadius: 4, background: cert.status === "Valid" ? "rgba(22,163,74,0.08)" : cert.status === "Expiring" ? "rgba(217,119,6,0.08)" : "rgba(220,38,38,0.08)", color: cert.status === "Valid" ? "#16A34A" : cert.status === "Expiring" ? "#D97706" : "#DC2626", border: `1px solid ${cert.status === "Valid" ? "rgba(22,163,74,0.2)" : cert.status === "Expiring" ? "rgba(217,119,6,0.2)" : "rgba(220,38,38,0.2)"}` }}>
                      {cert.name}{cert.status !== "Valid" ? ` (${cert.status})` : ""}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ padding: "0.75rem", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 8, fontSize: "0.8rem", color: "#16A34A", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={14} /> {selected.length} worker(s) assigned{allValid ? " — all certification checks passed" : ""}
          </div>
          {certWarnings.length > 0 && (
            <div style={{ padding: "0.85rem 1rem", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontWeight: 700, fontSize: "0.78rem", color: "#D97706" }}>
                <AlertTriangle size={14} /> Certification Warnings — Approver will be notified
              </div>
              {certWarnings.map(w => {
                const wFails = getFailures(w);
                return (
                  <div key={w.id} style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#2C2C2C" }}>{w.name}: </span>
                    <span style={{ fontSize: "0.72rem", color: "#D97706" }}>{wFails.join("; ")}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 6, fontSize: "0.68rem", color: "#6A6A6A", fontStyle: "italic" }}>
                You may still proceed. The approver will review cert gaps before issuing the permit.
              </div>
            </div>
          )}
        </div>
      )}

      {showAI && (
        <AIRecommendPanel
          workers={contractorWorkers}
          requiredCerts={requiredCerts}
          contractorName={contractorName}
          selected={selected}
          onToggle={onToggle}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}

// ─── Step 4: Checklist (Swipe Cards + Control Grid) ──────────────────────────

function Step4Checklist({ permitType, hazards, controls, isolation, isolationType, prework, onHazardChange, onControlChange, onIsolationChange, onIsolationTypeChange, onPreworkChange }: {
  permitType: string;
  hazards: Record<string, { applicable: boolean; risk: string }>;
  controls: Record<string, boolean>;
  isolation: string;
  isolationType: string;
  prework: Record<string, boolean | null>;
  onHazardChange: (id: string, field: string, val: any) => void;
  onControlChange: (id: string, val: boolean) => void;
  onIsolationChange: (v: string) => void;
  onIsolationTypeChange: (v: string) => void;
  onPreworkChange: (id: string, val: boolean) => void;
}) {
  const [currentHazardIdx, setCurrentHazardIdx] = useState(0);
  const hazardList = HAZARD_LIBRARY[permitType] || [];
  const controlGroups = CONTROL_CATEGORIES[permitType] || [];
  const controlList = CONTROL_LIBRARY[permitType] || [];

  const ratedCount = hazardList.filter(h => hazards[h.description] !== undefined).length;
  const confirmedControls = controlList.filter(c => controls[c.description] !== false).length;
  const unconfirmedMandatory = controlList.filter(c => c.mandatory && controls[c.description] === false);

  const currentHazard = hazardList[currentHazardIdx];
  const currentHazardState = currentHazard
    ? (hazards[currentHazard.description] ?? { applicable: true, risk: currentHazard.defaultRisk })
    : null;

  const hasHigh = hazardList.some(h => {
    const s = hazards[h.description] ?? { applicable: true, risk: h.defaultRisk };
    return s.applicable && s.risk === "High";
  });

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>Safety Checklist</h2>
      <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginBottom: "1.5rem" }}>
        IS 17893 pre-populated hazards and controls. Rate each hazard, then confirm all control measures are in place.
      </p>

      {/* ── Hazard Cards ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1 }}>Hazard Identification</div>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, color: ratedCount === hazardList.length ? "#16A34A" : "#6A6A6A" }}>
            {ratedCount} of {hazardList.length} rated {ratedCount === hazardList.length ? "✓" : ""}
          </div>
        </div>

        {/* Dot navigation */}
        <div style={{ display: "flex", gap: 5, marginBottom: 12, alignItems: "center" }}>
          {hazardList.map((h, i) => {
            const s = hazards[h.description] ?? { applicable: true, risk: h.defaultRisk };
            const rated = hazards[h.description] !== undefined;
            const dotColor = rated
              ? (s.applicable ? (s.risk === "High" ? "#DC2626" : s.risk === "Medium" ? "#D97706" : "#16A34A") : "#9CA3AF")
              : "#E5E7EB";
            return (
              <button
                key={i}
                onClick={() => setCurrentHazardIdx(i)}
                style={{ width: i === currentHazardIdx ? 22 : 8, height: 8, borderRadius: 4, background: dotColor, border: `1.5px solid ${i === currentHazardIdx ? (rated ? dotColor : "#D1D5DB") : "transparent"}`, cursor: "pointer", padding: 0, transition: "all 0.2s" }}
              />
            );
          })}
          <span style={{ marginLeft: 8, fontSize: "0.68rem", color: "#9CA3AF" }}>{currentHazardIdx + 1} / {hazardList.length}</span>
        </div>

        {currentHazard && currentHazardState && (
          <div style={{ background: "#FFFBF8", border: `1.5px solid ${currentHazardState.applicable && currentHazardState.risk === "High" ? "rgba(220,38,38,0.25)" : "rgba(245,134,52,0.2)"}`, borderRadius: 12, padding: "1.4rem 1.5rem", position: "relative" }}>
            {currentHazardState.applicable && currentHazardState.risk === "High" && (
              <div style={{ position: "absolute", top: 10, right: 10, fontSize: "0.6rem", background: "rgba(220,38,38,0.1)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>
                ⚠ HIGH — SO REVIEW TRIGGERED
              </div>
            )}
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Hazard {currentHazardIdx + 1} of {hazardList.length}
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#2C2C2C", marginBottom: 6, lineHeight: 1.4 }}>
              {currentHazard.description}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6A6A6A", marginBottom: "1.25rem" }}>
              Rate the risk level at this specific work location:
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
              {[
                { label: "N/A", value: null, color: "#9CA3AF", bg: "#F3F4F6", border: "#D1D5DB" },
                { label: "🟢 Low", value: "Low", color: "#16A34A", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.3)" },
                { label: "🟡 Medium", value: "Medium", color: "#D97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.3)" },
                { label: "🔴 High", value: "High", color: "#DC2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.3)" },
              ].map(opt => {
                const isSelected = opt.value === null
                  ? !currentHazardState.applicable
                  : currentHazardState.applicable && currentHazardState.risk === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => {
                      if (opt.value === null) {
                        onHazardChange(currentHazard.description, "applicable", false);
                      } else {
                        onHazardChange(currentHazard.description, "applicable", true);
                        onHazardChange(currentHazard.description, "risk", opt.value);
                      }
                    }}
                    style={{
                      flex: 1, padding: "10px 6px", borderRadius: 8,
                      border: `2px solid ${isSelected ? opt.border : "#E5E7EB"}`,
                      background: isSelected ? opt.bg : "#F9FAFB",
                      color: isSelected ? opt.color : "#6A6A6A",
                      cursor: "pointer", fontSize: "0.78rem", fontWeight: isSelected ? 700 : 400, transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setCurrentHazardIdx(i => Math.max(0, i - 1))} disabled={currentHazardIdx === 0} className="btn btn-ghost btn-sm" style={{ opacity: currentHazardIdx === 0 ? 0.3 : 1 }}>
                <ChevronLeft size={14} /> Previous
              </button>
              <button onClick={() => setCurrentHazardIdx(i => Math.min(hazardList.length - 1, i + 1))} disabled={currentHazardIdx === hazardList.length - 1} className="btn btn-ghost btn-sm" style={{ opacity: currentHazardIdx === hazardList.length - 1 ? 0.3 : 1 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {hasHigh && (
          <div style={{ marginTop: 10, padding: "0.6rem 0.9rem", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 8, display: "flex", gap: 7, alignItems: "center", fontSize: "0.73rem", color: "#DC2626" }}>
            <AlertTriangle size={12} />
            High-risk hazards identified — Safety Officer review will be triggered before approver sign-off (IS 17893 §3.6)
          </div>
        )}
      </div>

      {/* ── Control Measures Grid ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1 }}>Control Measures</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {unconfirmedMandatory.length > 0 && (
              <span style={{ fontSize: "0.68rem", color: "#DC2626", fontWeight: 600, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, padding: "2px 8px" }}>
                {unconfirmedMandatory.length} mandatory unconfirmed
              </span>
            )}
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: confirmedControls === controlList.length ? "#16A34A" : "#6A6A6A" }}>
              {confirmedControls} / {controlList.length} confirmed
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {controlGroups.map(group => (
            <div key={group.label}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6A6A6A", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <span>{group.icon}</span> {group.label.toUpperCase()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {group.controls.map(ctrlDesc => {
                  const ctrl = controlList.find(c => c.description === ctrlDesc);
                  if (!ctrl) return null;
                  const isConfirmed = controls[ctrlDesc] !== false;
                  return (
                    <button
                      key={ctrlDesc}
                      onClick={() => onControlChange(ctrlDesc, !isConfirmed)}
                      style={{
                        textAlign: "left", padding: "0.85rem", borderRadius: 10, cursor: "pointer",
                        border: `2px solid ${isConfirmed ? "rgba(22,163,74,0.3)" : ctrl.mandatory ? "rgba(220,38,38,0.3)" : "rgba(220,38,38,0.2)"}`,
                        background: isConfirmed ? "rgba(22,163,74,0.04)" : ctrl.mandatory ? "rgba(220,38,38,0.04)" : "rgba(220,38,38,0.02)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", background: isConfirmed ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.1)", border: `1.5px solid ${isConfirmed ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.2)"}` }}>
                          {isConfirmed ? <CheckCircle size={12} color="#16A34A" /> : <XCircle size={12} color="#DC2626" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.75rem", color: "#2C2C2C", lineHeight: 1.4 }}>{ctrlDesc}</div>
                          {ctrl.mandatory && (
                            <span style={{ display: "inline-block", marginTop: 4, fontSize: "0.6rem", fontWeight: 700, borderRadius: 3, padding: "1px 5px", background: isConfirmed ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: isConfirmed ? "#16A34A" : "#DC2626", border: `1px solid ${isConfirmed ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>
                              IS 17893 MANDATORY
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Isolation ── */}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🔒 Isolation Requirement</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          {[
            { val: "yes", label: "Isolation Required", desc: "Energy source must be isolated before work begins", color: "#D97706" },
            { val: "no", label: "No Isolation Required", desc: "Work does not require energy source isolation", color: "#16A34A" },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => onIsolationChange(opt.val)}
              style={{ flex: 1, padding: "0.75rem", borderRadius: 8, cursor: "pointer", textAlign: "left", border: `2px solid ${isolation === opt.val ? opt.color : "#E5E7EB"}`, background: isolation === opt.val ? `${opt.color}0A` : "#FFFFFF", transition: "all 0.15s" }}
            >
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isolation === opt.val ? opt.color : "#2C2C2C", marginBottom: 2 }}>{opt.label}</div>
              <div style={{ fontSize: "0.68rem", color: "#6A6A6A" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
        {isolation === "yes" && (
          <select value={isolationType} onChange={e => onIsolationTypeChange(e.target.value)} style={{ maxWidth: 400 }}>
            <option value="">Select isolation method…</option>
            {ISOLATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
      </div>

      {/* ── Pre-Work Verification Checklist ── */}
      {(() => {
        const items = PREWORK_CHECKLIST[permitType] || [];
        if (items.length === 0) return null;
        const answered = items.filter(i => prework[i.id] !== undefined && prework[i.id] !== null).length;
        const failed = items.filter(i => prework[i.id] === false);
        const criticalFailed = failed.filter(i => i.critical);
        const allAnswered = answered === items.length;

        return (
          <div style={{ marginTop: "1.5rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F58634", textTransform: "uppercase", letterSpacing: 1 }}>
                  ✅ Pre-Work Verification Checklist
                </div>
                <div style={{ fontSize: "0.68rem", color: "#6A6A6A", marginTop: 2 }}>
                  IS 17893 — Confirm all site conditions are in place before work starts
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {criticalFailed.length > 0 && (
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#DC2626", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, padding: "2px 8px" }}>
                    {criticalFailed.length} critical ✗
                  </span>
                )}
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: allAnswered ? (failed.length === 0 ? "#16A34A" : "#D97706") : "#6A6A6A" }}>
                  {answered} / {items.length} answered {allAnswered && failed.length === 0 ? "✓" : ""}
                </span>
              </div>
            </div>

            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((item) => {
                const val = prework[item.id] ?? null;
                const isYes = val === true;
                const isNo = val === false;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "grid", gridTemplateColumns: "1fr auto",
                      gap: 10, alignItems: "center",
                      padding: "0.75rem 1rem",
                      background: isNo ? "rgba(220,38,38,0.04)" : isYes ? "rgba(22,163,74,0.04)" : "#FFFFFF",
                      border: `1px solid ${isNo ? "rgba(220,38,38,0.25)" : isYes ? "rgba(22,163,74,0.2)" : "#E5E7EB"}`,
                      borderRadius: 8, transition: "all 0.15s",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        {item.critical && (
                          <span style={{ flexShrink: 0, fontSize: "0.58rem", fontWeight: 700, background: "rgba(220,38,38,0.1)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 3, padding: "1px 5px", marginTop: 1 }}>
                            CRITICAL
                          </span>
                        )}
                        <span style={{ fontSize: "0.78rem", color: "#2C2C2C", lineHeight: 1.45 }}>{item.text}</span>
                      </div>
                      {item.note && (
                        <div style={{ marginTop: 3, fontSize: "0.65rem", color: "#9CA3AF", fontStyle: "italic" }}>
                          📝 {item.note}
                        </div>
                      )}
                    </div>
                    {/* Yes / No toggle */}
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <button
                        onClick={() => onPreworkChange(item.id, true)}
                        style={{
                          padding: "5px 14px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700,
                          cursor: "pointer", border: `1.5px solid ${isYes ? "#16A34A" : "#D1D5DB"}`,
                          background: isYes ? "#16A34A" : "#F9FAFB", color: isYes ? "#FFFFFF" : "#6A6A6A",
                          transition: "all 0.12s",
                        }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => onPreworkChange(item.id, false)}
                        style={{
                          padding: "5px 14px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700,
                          cursor: "pointer", border: `1.5px solid ${isNo ? "#DC2626" : "#D1D5DB"}`,
                          background: isNo ? "#DC2626" : "#F9FAFB", color: isNo ? "#FFFFFF" : "#6A6A6A",
                          transition: "all 0.12s",
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary banners */}
            {criticalFailed.length > 0 && (
              <div style={{ marginTop: 10, padding: "0.7rem 0.9rem", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, fontSize: "0.73rem", color: "#DC2626", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>{criticalFailed.length} critical pre-work condition(s) not met.</strong> Approver will be flagged.
                  The Safety Officer must physically verify and clear these before permit activation.
                </div>
              </div>
            )}
            {allAnswered && failed.length === 0 && (
              <div style={{ marginTop: 10, padding: "0.6rem 0.9rem", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 8, fontSize: "0.73rem", color: "#16A34A", display: "flex", gap: 7, alignItems: "center" }}>
                <CheckCircle size={13} /> All pre-work conditions verified. Site is ready for work to commence.
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Step 5: Approval Flow Preview ───────────────────────────────────────────

function Step5ApprovalChain({ permitType, hasHighRisk }: { permitType: string; hasHighRisk: boolean }) {
  const chain = APPROVAL_CHAIN[permitType] || APPROVAL_CHAIN["Cold Work"];
  const soSteps = chain.filter(s => s.role === "Safety Officer");

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>Approval Chain</h2>
      <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginBottom: "1.5rem" }}>
        IS 17893 defines the mandatory approval sequence for <strong>{permitType}</strong>. This permit requires{" "}
        <strong style={{ color: "#F58634" }}>{chain.length} steps</strong> before activation.
      </p>

      {/* Chain cards */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 0, marginBottom: "1.5rem", overflowX: "auto" }}>
        {chain.map((step, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 140 }}>
            <div style={{ flex: 1, background: "#FAFAFA", border: `1.5px solid ${step.color}33`, borderRadius: 10, padding: "1rem", position: "relative", height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${step.color}15`, border: `2px solid ${step.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: step.color }}>{idx + 1}</span>
                </div>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: step.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{step.role}</div>
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2C2C2C", marginBottom: 3, lineHeight: 1.3 }}>{step.action}</div>
              <div style={{ fontSize: "0.65rem", color: "#6A6A6A", marginBottom: 8, lineHeight: 1.4 }}>{step.designation}</div>
              <div style={{ fontSize: "0.6rem", background: `${step.color}0D`, border: `1px solid ${step.color}22`, borderRadius: 4, padding: "3px 7px", color: step.color, fontWeight: 600, lineHeight: 1.4 }}>
                {step.certReq}
              </div>
              {step.note && (
                <div style={{ marginTop: 6, fontSize: "0.6rem", color: "#9CA3AF", fontStyle: "italic", lineHeight: 1.4 }}>{step.note}</div>
              )}
            </div>
            {idx < chain.length - 1 && (
              <div style={{ padding: "0 4px", flexShrink: 0 }}>
                <ChevronRight size={16} color="#D1D5DB" />
              </div>
            )}
          </div>
        ))}
      </div>

      {hasHighRisk && (
        <div style={{ padding: "0.9rem 1rem", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start", marginBottom: "1rem" }}>
          <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#DC2626", marginBottom: 3 }}>High-Risk Permit — Physical Safety Inspection Required</div>
            <div style={{ fontSize: "0.72rem", color: "#6A6A6A", lineHeight: 1.5 }}>
              One or more hazards were rated HIGH. Per IS 17893 §3.6, the Safety Officer must physically inspect and clear the work area before the approver can sign off. This typically adds 2–4 hours to the approval cycle.
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Total Approvals Required", value: chain.length.toString(), color: "#F58634" },
          { label: "Safety Reviews", value: soSteps.length.toString(), color: "#16A34A" },
          { label: "Est. Approval Cycle", value: hasHighRisk ? "4–8 hrs" : "1–3 hrs", color: "#D97706" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#F9FAFB", borderRadius: 8, padding: "0.85rem", textAlign: "center", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: "0.65rem", color: "#6A6A6A", marginTop: 4, lineHeight: 1.4 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 6: Site Photos ──────────────────────────────────────────────────────

function Step6Photos({ photos, onPhotoAdd, onPhotoRemove }: {
  photos: { id: string; category: string; url: string; name: string }[];
  onPhotoAdd: (p: { id: string; category: string; url: string; name: string }) => void;
  onPhotoRemove: (id: string) => void;
}) {
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, categoryId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onPhotoAdd({ id: `photo-${Date.now()}`, category: categoryId, url, name: file.name });
    e.target.value = "";
  }

  const byCategory: Record<string, { id: string; url: string; name: string } | undefined> = {};
  photos.forEach(p => { byCategory[p.category] = p; });

  const requiredCount = PHOTO_CATEGORIES.filter(c => c.required).length;
  const uploadedRequired = PHOTO_CATEGORIES.filter(c => c.required && byCategory[c.id]).length;

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>Site Documentation</h2>
      <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginBottom: "1.5rem" }}>
        Upload photos of the work area for permit records. The approver and safety officer will review these.{" "}
        <strong style={{ color: "#F58634" }}>3 photos required,</strong> 2 optional.
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {PHOTO_CATEGORIES.map(cat => {
            const uploaded = !!byCategory[cat.id];
            return (
              <div key={cat.id} style={{ width: 8, height: 8, borderRadius: "50%", background: uploaded ? "#16A34A" : cat.required ? "#D1D5DB" : "#F3F4F6", border: `1.5px solid ${uploaded ? "#16A34A" : "transparent"}` }} />
            );
          })}
        </div>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: uploadedRequired === requiredCount ? "#16A34A" : "#D97706" }}>
          {uploadedRequired} of {requiredCount} required photos uploaded
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {PHOTO_CATEGORIES.map(cat => {
          const uploaded = byCategory[cat.id];
          return (
            <div key={cat.id} style={{ border: `2px solid ${uploaded ? "rgba(22,163,74,0.3)" : cat.required ? "rgba(245,134,52,0.25)" : "#E5E7EB"}`, borderRadius: 10, overflow: "hidden", background: "#FAFAFA" }}>
              {uploaded ? (
                <div style={{ position: "relative" }}>
                  <img src={uploaded.url} alt={cat.label} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(22,163,74,0.9)", borderRadius: 6, padding: "2px 8px", fontSize: "0.62rem", fontWeight: 700, color: "#fff" }}>✓ Uploaded</div>
                  <button onClick={() => onPhotoRemove(uploaded.id)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(220,38,38,0.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                    <X size={12} />
                  </button>
                  <div style={{ padding: "8px 10px", background: "#fff" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#2C2C2C" }}>{cat.label}</div>
                    <div style={{ fontSize: "0.62rem", color: "#9CA3AF", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploaded.name}</div>
                  </div>
                </div>
              ) : (
                <label style={{ display: "block", padding: "1.5rem 1rem 1rem", cursor: "pointer", textAlign: "center" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFileChange(e, cat.id)} />
                  <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{cat.icon}</div>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: cat.required ? "rgba(245,134,52,0.08)" : "#F3F4F6", border: `1.5px dashed ${cat.required ? "rgba(245,134,52,0.4)" : "#D1D5DB"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    <Upload size={16} color={cat.required ? "#F58634" : "#9CA3AF"} />
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2C2C2C", marginBottom: 2 }}>{cat.label}</div>
                  <div style={{ fontSize: "0.65rem", color: "#6A6A6A", marginBottom: 8, lineHeight: 1.4 }}>{cat.desc}</div>
                  {cat.required
                    ? <span style={{ fontSize: "0.62rem", background: "rgba(245,134,52,0.08)", color: "#F58634", border: "1px solid rgba(245,134,52,0.2)", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>REQUIRED</span>
                    : <span style={{ fontSize: "0.62rem", color: "#9CA3AF" }}>Optional</span>
                  }
                </label>
              )}
            </div>
          );
        })}
      </div>

      {uploadedRequired < requiredCount && (
        <div style={{ marginTop: 14, padding: "0.75rem 1rem", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: 8, display: "flex", gap: 8, alignItems: "center", fontSize: "0.75rem", color: "#D97706" }}>
          <AlertTriangle size={13} />
          {requiredCount - uploadedRequired} required photo(s) still missing. You can proceed, but the approver may request them before signing off.
        </div>
      )}
    </div>
  );
}

// ─── Step 7: Acknowledgement ──────────────────────────────────────────────────

function Step7({ requesterAck, supervisorAck, requesterName, supervisorName, onToggle }: {
  requesterAck: boolean;
  supervisorAck: boolean;
  requesterName: string;
  supervisorName: string;
  onToggle: (who: "requester" | "supervisor") => void;
}) {
  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>Dual Acknowledgement</h2>
      <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginBottom: "1.5rem" }}>
        IS 17893 §2.6 — Both Requester and Contractor Supervisor must acknowledge the risk assessment separately.
        Permit cannot proceed until both are recorded.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          {
            who: "requester" as const,
            label: "Requester / Issuer Acknowledgement",
            person: requesterName,
            statement: "I confirm that I have reviewed the risk assessment, all hazards are identified, control measures are in place, and this permit may be submitted for approval.",
          },
          {
            who: "supervisor" as const,
            label: "Contractor Supervisor Acknowledgement",
            person: supervisorName || "Contractor Supervisor",
            statement: "I confirm that I have read and understood the risk assessment, briefed all assigned workers on the hazards and control measures, and accept responsibility for implementing the controls during work.",
          },
        ].map(({ who, label, person, statement }) => {
          const acked = who === "requester" ? requesterAck : supervisorAck;
          return (
            <div key={who} style={{ background: "#F9FAFB", border: `1px solid ${acked ? "rgba(22,163,74,0.3)" : "#E5E7EB"}`, borderRadius: 10, padding: "1.2rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2C2C2C" }}>{label}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6A6A6A", marginTop: 3 }}>{person}</div>
                </div>
                {acked && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#16A34A", fontSize: "0.75rem", fontWeight: 700 }}>
                    <CheckCircle size={14} />
                    Acknowledged {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
              <p style={{ fontSize: "0.78rem", color: "#6A6A6A", lineHeight: 1.6, marginBottom: 12, background: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: 6 }}>
                "{statement}"
              </p>
              <button onClick={() => onToggle(who)} className={`btn ${acked ? "btn-ghost" : "btn-primary"}`} style={{ gap: 6 }}>
                {acked ? (<><XCircle size={13} /> Revoke</>) : (<><Shield size={13} /> Acknowledge Risk Assessment</>)}
              </button>
            </div>
          );
        })}
      </div>
      {requesterAck && supervisorAck && (
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 8, fontSize: "0.8rem", color: "#16A34A", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={14} /> Both acknowledgements recorded. Permit ready for submission.
        </div>
      )}
    </div>
  );
}

// ─── Step 8: Submit ───────────────────────────────────────────────────────────

function Step8({ permitType, form, workerCount, contractorName, hasHighRisk, onSubmit }: {
  permitType: string; form: Record<string, string>; workerCount: number;
  contractorName: string; hasHighRisk: boolean; onSubmit: () => void;
}) {
  const typeInfo = PERMIT_TYPES.find(p => p.value === permitType);
  const chain = APPROVAL_CHAIN[permitType] || APPROVAL_CHAIN["Cold Work"];
  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>Review & Submit</h2>
      <p style={{ fontSize: "0.8rem", color: "#6A6A6A", marginBottom: "1.5rem" }}>
        Review summary before submission. Permit number auto-generated on submit.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Permit Type", value: `${typeInfo?.icon} ${permitType}` },
          { label: "Nature of Job", value: form.jobNature || "—" },
          { label: "Location", value: form.area ? `${form.plant} — ${form.area}` : "—" },
          { label: "Issued To", value: form.issuedTo ? form.issuedTo.split(" — ")[0] : "—" },
          { label: "Equipment Tag", value: form.equipment || "—" },
          { label: "Contractor", value: contractorName || "—" },
          { label: "Planned Start", value: form.start ? new Date(form.start).toLocaleString("en-IN") : "—" },
          { label: "Planned End", value: form.end ? new Date(form.end).toLocaleString("en-IN") : "—" },
          { label: "Workers Assigned", value: `${workerCount} workers` },
          { label: "Isolation Required", value: form.isolation === "yes" ? `Yes — ${form.isolationType || "type not set"}` : "No" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#F9FAFB", borderRadius: 8, padding: "0.75rem" }}>
            <div style={{ fontSize: "0.68rem", color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2C2C2C" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Approval chain summary */}
      <div style={{ padding: "0.9rem 1rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Approval Chain on Submission</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {chain.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: s.color, background: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: 4, padding: "2px 8px" }}>{s.role}</span>
              {i < chain.length - 1 && <ChevronRight size={12} color="#D1D5DB" />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0.9rem 1rem", background: hasHighRisk ? "rgba(124,58,237,0.08)" : "rgba(245,134,52,0.06)", border: `1px solid ${hasHighRisk ? "rgba(124,58,237,0.25)" : "rgba(245,134,52,0.15)"}`, borderRadius: 8, marginBottom: "1.5rem", fontSize: "0.78rem", color: hasHighRisk ? "#7C3AED" : "#6A6A6A" }}>
        <strong style={{ color: hasHighRisk ? "#7C3AED" : "#F58634" }}>On submit: </strong>
        Auto-generate permit number (TYPE-YEAR-SEQ) ·
        {hasHighRisk
          ? " Status → UNDER SAFETY REVIEW — Safety Officer must clear before Approver sees this permit"
          : " Status → PENDING APPROVAL — Approver notified via Email + SMS"}
      </div>
      <button onClick={onSubmit} className="btn btn-success btn-lg" style={{ gap: 8, width: "100%" }}>
        <Shield size={16} /> Submit Permit for Approval
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreatePermit() {
  const navigate = useNavigate();
  const { state, dispatch, role } = useStore();
  const [step, setStep] = useState(0);
  const [permitType, setPermitType] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [workerIds, setWorkerIds] = useState<string[]>([]);
  const [hazards, setHazards] = useState<Record<string, { applicable: boolean; risk: string }>>({});
  const [controls, setControls] = useState<Record<string, boolean>>({});
  const [isolation, setIsolation] = useState("no");
  const [isolationType, setIsolationType] = useState("");
  const [prework, setPrework] = useState<Record<string, boolean | null>>({});
  const [photos, setPhotos] = useState<{ id: string; category: string; url: string; name: string }[]>([]);
  const [requesterAck, setRequesterAck] = useState(false);
  const [supervisorAck, setSupervisorAck] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedNumber, setSubmittedNumber] = useState("");

  const activeContractors = state.contractors.filter(c => c.status === "Active");
  const selectedContractor = activeContractors.find(c => c.id === form.contractorId);
  const assignedWorkers = state.workers.filter(w => workerIds.includes(w.id));
  const supervisorWorker = assignedWorkers.find(w => w.role === "Supervisor");

  const hazardList = HAZARD_LIBRARY[permitType] || [];
  const hasHighRisk = hazardList.some(h => {
    const s = hazards[h.description] ?? { applicable: true, risk: h.defaultRisk };
    return s.applicable && s.risk === "High";
  });

  const canNext = [
    !!permitType,
    !!(form.plant && form.area && form.start && form.end && form.description && form.contractorId && form.issuedTo && form.jobNature),
    workerIds.length > 0,
    true,
    true,
    true,
    requesterAck && supervisorAck,
    true,
  ][step];

  function handleSubmit() {
    const hazardObjects: Hazard[] = (HAZARD_LIBRARY[permitType] || []).map((h, i) => {
      const s = hazards[h.description] ?? { applicable: true, risk: h.defaultRisk };
      return { id: `h-${Date.now()}-${i}`, description: h.description, riskLevel: s.risk as "Low" | "Medium" | "High", applicable: s.applicable };
    });
    const controlObjects: ControlMeasure[] = (CONTROL_LIBRARY[permitType] || []).map((c, i) => ({
      id: `c-${Date.now()}-${i}`, description: c.description,
      selected: controls[c.description] !== undefined ? controls[c.description] : true,
      mandatory: c.mandatory,
    }));
    const number = genPermitNumber(permitType, state.permits);
    const newStatus = hasHighRisk ? "Under Safety Review" : "Pending Approval";
    const permit: Permit = {
      id: `p-${Date.now()}`, number, type: permitType as PermitType, status: newStatus,
      area: `${form.plant} — ${form.area}`, equipment: form.equipment || undefined,
      jobDescription: form.description, contractorId: form.contractorId,
      contractorName: selectedContractor?.name || "",
      requestedBy: `${role.name} (${role.title})`,
      supervisorId: supervisorWorker?.id || "", supervisorName: supervisorWorker?.name || "",
      workers: assignedWorkers, requestDate: new Date().toISOString(),
      plannedStart: new Date(form.start).toISOString(), plannedEnd: new Date(form.end).toISOString(),
      riskAssessment: {
        hazards: hazardObjects, controls: controlObjects,
        requiresIsolation: isolation === "yes",
        isolationType: isolation === "yes" ? isolationType : undefined,
        requesterAck: new Date().toISOString(), supervisorAck: new Date().toISOString(),
      },
      approvalTrail: [], operationalEvents: [], auditRecords: [], nonConformances: [], dailyLogs: [],
      specialInstructions: form.instructions || undefined,
      workerCount: workerIds.length, headcountInside: 0,
    };
    dispatch({ type: "ADD_PERMIT", payload: permit });
    setSubmittedNumber(number);
    setSubmitted(true);
  }

  if (submitted) {
    const chain = APPROVAL_CHAIN[permitType] || APPROVAL_CHAIN["Cold Work"];
    return (
      <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#16A34A", marginBottom: 8 }}>Permit Submitted Successfully</h1>
        <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2C2C2C", marginBottom: 4, fontFamily: "monospace" }}>{submittedNumber}</div>
        <div style={{ margin: "1rem auto", padding: "0.75rem 1rem", background: hasHighRisk ? "rgba(124,58,237,0.08)" : "rgba(22,163,74,0.06)", border: `1px solid ${hasHighRisk ? "rgba(124,58,237,0.25)" : "rgba(22,163,74,0.25)"}`, borderRadius: 8, display: "inline-block" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: hasHighRisk ? "#7C3AED" : "#16A34A" }}>
            Status: {hasHighRisk ? "Under Safety Review" : "Pending Approval"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6A6A6A", marginTop: 2 }}>
            {hasHighRisk ? "Safety Officer must review before Approver sees this permit" : "Approver has been notified and can act now"}
          </div>
        </div>
        <div style={{ margin: "1.25rem auto", maxWidth: 420 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6A6A6A", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Next approvals required</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {chain.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: s.color, background: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: 4, padding: "2px 8px" }}>{s.role}</span>
                {i < chain.length - 1 && <ChevronRight size={12} color="#D1D5DB" />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={() => navigate("/approval")}>View Approval Queue</button>
          <button className="btn btn-ghost" onClick={() => navigate("/permits")}>Back to Permits</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 940, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2C2C2C" }}>Create New Permit</h1>
        <p style={{ fontSize: "0.78rem", color: "#6A6A6A", marginTop: 3 }}>IS 17893 compliant PTW permit creation — logged as {role.name} ({role.title})</p>
      </div>

      <div className="ptw-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <StepIndicator current={step} />

        {step === 0 && <Step1 selected={permitType} onSelect={setPermitType} />}
        {step === 1 && (
          <Step2
            form={form}
            permitType={permitType}
            contractors={activeContractors}
            onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
          />
        )}
        {step === 2 && (
          <Step3
            permitType={permitType}
            contractorId={form.contractorId || ""}
            selected={workerIds}
            workers={state.workers}
            contractors={activeContractors}
            onToggle={id => setWorkerIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])}
          />
        )}
        {step === 3 && (
          <Step4Checklist
            permitType={permitType}
            hazards={hazards}
            controls={controls}
            isolation={isolation}
            isolationType={isolationType}
            prework={prework}
            onHazardChange={(id, field, val) => setHazards(h => ({ ...h, [id]: { ...(h[id] ?? { applicable: true, risk: "Medium" }), [field]: val } }))}
            onControlChange={(id, val) => setControls(c => ({ ...c, [id]: val }))}
            onIsolationChange={setIsolation}
            onIsolationTypeChange={setIsolationType}
            onPreworkChange={(id, val) => setPrework(p => ({ ...p, [id]: val }))}
          />
        )}
        {step === 4 && <Step5ApprovalChain permitType={permitType} hasHighRisk={hasHighRisk} />}
        {step === 5 && (
          <Step6Photos
            photos={photos}
            onPhotoAdd={p => setPhotos(ps => [...ps, p])}
            onPhotoRemove={id => setPhotos(ps => ps.filter(p => p.id !== id))}
          />
        )}
        {step === 6 && (
          <Step7
            requesterAck={requesterAck}
            supervisorAck={supervisorAck}
            requesterName={role.name}
            supervisorName={supervisorWorker?.name || ""}
            onToggle={who => {
              if (who === "requester") setRequesterAck(v => !v);
              else setSupervisorAck(v => !v);
            }}
          />
        )}
        {step === 7 && (
          <Step8
            permitType={permitType}
            form={{ ...form, isolation, isolationType }}
            workerCount={workerIds.length}
            contractorName={selectedContractor?.name || ""}
            hasHighRisk={hasHighRisk}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => step === 0 ? navigate("/permits") : setStep(s => s - 1)}>
          <ChevronLeft size={14} /> {step === 0 ? "Cancel" : "Back"}
        </button>
        {step < STEPS.length - 1 && (
          <button
            className="btn btn-primary"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext}
            style={{ opacity: canNext ? 1 : 0.45 }}
          >
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
