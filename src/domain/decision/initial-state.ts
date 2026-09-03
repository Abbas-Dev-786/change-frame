import type { DecisionRoomState } from "./types"

export const PLAN_VIEWBOX = { width: 760, height: 520 } as const

export const DEFAULT_CONSTRAINT_RECT = {
  x: 510,
  y: 180,
  width: 120,
  height: 160,
} as const

/**
 * A fresh session contains one replaceable starter project, but no resolution
 * options or predetermined answer. The agent can replace this context before it
 * authors alternatives.
 */
export function createInitialDecisionState(now = new Date().toISOString()): DecisionRoomState {
  return {
    phase: "INVESTIGATING",
    stateVersion: 1,
    contextConfigured: true,
    contextSource: "starter",
    project: {
      id: "PROJECT-01",
      name: "Riverside Office Tower",
      budget: 8420000,
      currentForecast: 8420000,
      currency: "USD",
    },
    activeIssue: {
      id: "ISS-019",
      title: "HVAC duct conflicts with structural beam B14",
      description: "A 24-inch supply duct intersects structural beam B14 near Corridor C on drawing M-204.",
      severity: "high",
      status: "Decision required",
      drawingId: "M-204",
      location: "Level 4 Mechanical Room / Corridor C",
      elementIds: ["DUCT-D22", "BEAM-B14"],
      affectedActivityIds: ["MEP-342", "MEP-347", "INS-118"],
      affectedContractIds: ["MEP-04", "STR-02"],
    },
    drawings: [
      { id: "M-204", name: "Level 4 Mechanical Plan", discipline: "mechanical", level: "Level 4" },
      { id: "S-202", name: "Level 4 Structural Plan", discipline: "structural", level: "Level 4" },
      { id: "A-201", name: "Level 4 Architectural Plan", discipline: "architectural", level: "Level 4" },
    ],
    drawingElements: [
      { id: "ROOM-M401", type: "room", label: "Mechanical Room M401", drawingId: "M-204", geometry: { x: 86, y: 86, width: 292, height: 252 }, trade: "mechanical" },
      { id: "CORRIDOR-C3", type: "corridor", label: "Corridor C", drawingId: "M-204", geometry: { x: 378, y: 108, width: 294, height: 280 }, trade: "architectural" },
      { id: "DUCT-D22", type: "duct", label: "24-inch supply duct D22", drawingId: "M-204", geometry: { x: 122, y: 238, width: 456, height: 24 }, trade: "mechanical" },
      { id: "BEAM-B14", type: "beam", label: "Structural beam B14", drawingId: "M-204", geometry: { x: 392, y: 206, width: 120, height: 86 }, trade: "structural" },
      { id: "RISER-E04", type: "riser", label: "Electrical riser E04", drawingId: "M-204", geometry: { x: 548, y: 210, width: 54, height: 96 }, trade: "electrical" },
    ],
    schedule: [
      { id: "STR-210", name: "Structural framing complete", start: "2026-09-06", finish: "2026-09-11", durationDays: 5, trade: "structural", dependencies: [] },
      { id: "MEP-342", name: "Level 4 duct installation", start: "2026-09-12", finish: "2026-09-16", durationDays: 4, trade: "mechanical", dependencies: ["STR-210"] },
      { id: "MEP-347", name: "Mechanical testing", start: "2026-09-17", finish: "2026-09-18", durationDays: 2, trade: "mechanical", dependencies: ["MEP-342"] },
      { id: "INS-118", name: "Above-ceiling inspection", start: "2026-09-19", finish: "2026-09-19", durationDays: 1, trade: "architectural", dependencies: ["MEP-347"] },
      { id: "FIN-402", name: "Ceiling close-up", start: "2026-09-20", finish: "2026-09-23", durationDays: 3, trade: "architectural", dependencies: ["INS-118"] },
    ],
    contracts: [
      { id: "MEP-04", name: "Mechanical package", trade: "mechanical", contractor: "Northline Mechanical", value: 1840000 },
      { id: "STR-02", name: "Structural package", trade: "structural", contractor: "Atlas Steel", value: 2260000 },
      { id: "ELEC-03", name: "Electrical package", trade: "electrical", contractor: "BrightGrid Electric", value: 1275000 },
    ],
    baselineConstraints: [
      { id: "BASE-STRUCTURE", type: "engineering", label: "Structural beam B14 cannot be modified without engineering review" },
      { id: "BASE-ACCESS", type: "operations", label: "Electrical riser E04 access must remain clear" },
    ],
    planViewBox: PLAN_VIEWBOX,
    activeDrawingId: "M-204",
    constraints: [],
    resolutionOptions: [],
    selectedOptionId: null,
    previewOptionId: null,
    impactSimulation: null,
    decision: null,
    changeOrder: null,
    activityLog: [{
      id: "ACT-001",
      type: "issue_loaded",
      label: "Starter project loaded",
      detail: "ISS-019 is ready for agent-authored alternatives or replacement with another live brief.",
      createdAt: now,
    }],
    lastError: null,
  }
}
