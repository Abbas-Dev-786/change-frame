import {
  configureDecisionContext,
  createInitialDecisionState,
  type AgentOptionProposal,
  type DecisionContextInput,
  type DecisionRoomState,
} from "@/src/domain/decision"

export const testContext: Omit<DecisionContextInput, "expectedStateVersion"> = {
  source: "agent",
  project: { id: "PRJ-HARBOR", name: "Harbor Medical Center", budget: 12500000, currentForecast: 12600000, currency: "USD" },
  activeIssue: {
    id: "ISS-VENT-42",
    title: "Exhaust route crosses MRI clearance zone",
    description: "A proposed exhaust route enters the protected MRI equipment clearance zone.",
    severity: "high",
    status: "Decision required",
    drawingId: "M-401",
    location: "Level 4 imaging suite",
    elementIds: ["DUCT-EX-9", "MRI-01"],
    affectedActivityIds: ["MEP-88", "INS-21"],
    affectedContractIds: ["MECH-7"],
  },
  drawings: [{ id: "M-401", name: "Imaging suite coordination plan", discipline: "mechanical", level: "Level 4" }],
  drawingElements: [
    { id: "DUCT-EX-9", type: "duct", label: "Exhaust route EX-9", drawingId: "M-401", geometry: { x: 80, y: 240, width: 520, height: 24 }, trade: "mechanical" },
    { id: "MRI-01", type: "equipment", label: "MRI protected zone", drawingId: "M-401", geometry: { x: 360, y: 170, width: 150, height: 170 }, trade: "general" },
  ],
  schedule: [
    { id: "MEP-88", name: "Install imaging exhaust", start: "2026-10-01", finish: "2026-10-04", durationDays: 4, trade: "mechanical", dependencies: [] },
    { id: "INS-21", name: "Above-ceiling inspection", start: "2026-10-05", finish: "2026-10-05", durationDays: 1, trade: "general", dependencies: ["MEP-88"] },
  ],
  contracts: [{ id: "MECH-7", name: "Mechanical package", trade: "mechanical", contractor: "AirWorks", value: 2200000 }],
  baselineConstraints: [{ id: "BASE-MRI", type: "fixed_clearance", label: "MRI clearance zone cannot move" }],
  planViewBox: { width: 760, height: 520 },
  activeDrawingId: "M-401",
}

export const agentOptions: AgentOptionProposal[] = [
  {
    id: "ALT-NORTH",
    strategy: "overhead-reroute",
    title: "Reroute north of the imaging suite",
    description: "Offset EX-9 into the north service bay and reconnect downstream.",
    rationale: "Avoids the fixed equipment zone while preserving the specified duct area.",
    assumptions: ["North service bay has 500 mm clear depth", "Engineer accepts two additional elbows"],
    confidence: 0.78,
    costImpact: 7200,
    scheduleImpactDays: 2,
    risk: "medium",
    route: { label: "North service bay route", points: [{ x: 80, y: 250 }, { x: 300, y: 250 }, { x: 300, y: 120 }, { x: 650, y: 120 }] },
  },
  {
    id: "ALT-REDUCE",
    strategy: "profile-reduction",
    title: "Reduce duct profile locally",
    description: "Use an engineered low-profile section through the coordination zone.",
    rationale: "Minimizes installation changes but requires acoustic and pressure validation.",
    assumptions: ["Fan static pressure margin is available"],
    confidence: 0.55,
    costImpact: 3900,
    scheduleImpactDays: 1,
    risk: "high",
    route: null,
  },
]

export function createConfiguredTestState(): DecisionRoomState {
  const initial = createInitialDecisionState("2026-09-03T08:00:00.000Z")
  const result = configureDecisionContext(initial, { ...testContext, expectedStateVersion: initial.stateVersion }, "2026-09-03T08:01:00.000Z")
  if (!result.success) throw new Error(result.message)
  return result.state
}
