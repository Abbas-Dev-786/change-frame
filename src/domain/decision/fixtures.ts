import type {
  Contract,
  DecisionRoomState,
  Drawing,
  DrawingElement,
  Issue,
  Project,
  ResolutionOption,
  ScheduleActivity,
} from "./types"

export const PLAN_VIEWBOX = {
  width: 760,
  height: 520,
} as const

export const DEFAULT_CONSTRAINT_RECT = {
  x: 510,
  y: 180,
  width: 120,
  height: 160,
} as const

export const projectFixture: Project = {
  id: "PROJECT-01",
  name: "Riverside Office Tower",
  budget: 8420000,
  currentForecast: 8420000,
}

export const drawingsFixture: Drawing[] = [
  {
    id: "M-204",
    name: "Level 4 Mechanical Plan",
    discipline: "mechanical",
    level: "Level 4",
  },
  {
    id: "S-202",
    name: "Level 4 Structural Plan",
    discipline: "structural",
    level: "Level 4",
  },
  {
    id: "A-201",
    name: "Level 4 Architectural Plan",
    discipline: "architectural",
    level: "Level 4",
  },
]

export const drawingElementsFixture: DrawingElement[] = [
  {
    id: "ROOM-M401",
    type: "room",
    label: "Mechanical Room M401",
    drawingId: "M-204",
    geometry: { x: 86, y: 86, width: 292, height: 252 },
    trade: "mechanical",
  },
  {
    id: "CORRIDOR-C3",
    type: "corridor",
    label: "Corridor C",
    drawingId: "M-204",
    geometry: { x: 378, y: 108, width: 294, height: 280 },
    trade: "architectural",
  },
  {
    id: "DUCT-D22",
    type: "duct",
    label: "24 inch supply duct D22",
    drawingId: "M-204",
    geometry: { x: 122, y: 238, width: 456, height: 24 },
    trade: "mechanical",
  },
  {
    id: "BEAM-B14",
    type: "beam",
    label: "Structural beam B14",
    drawingId: "M-204",
    geometry: { x: 392, y: 206, width: 120, height: 86 },
    trade: "structural",
  },
  {
    id: "RISER-E04",
    type: "riser",
    label: "Electrical riser E04",
    drawingId: "M-204",
    geometry: { x: 548, y: 210, width: 54, height: 96 },
    trade: "electrical",
  },
]

export const activeIssueFixture: Issue = {
  id: "ISS-019",
  title: "HVAC duct conflicts with structural beam B14",
  description:
    "A 24-inch supply duct intersects structural beam B14 near Corridor C on drawing M-204.",
  severity: "high",
  status: "Decision Required",
  drawingId: "M-204",
  location: "Level 4 Mechanical Room / Corridor C",
  elementIds: ["DUCT-D22", "BEAM-B14"],
  affectedActivityIds: ["MEP-342", "MEP-347", "INS-118"],
  affectedContractIds: ["MEP-04", "STR-02"],
}

export const scheduleFixture: ScheduleActivity[] = [
  {
    id: "STR-210",
    name: "Structural framing complete",
    start: "2026-09-06",
    finish: "2026-09-11",
    durationDays: 5,
    trade: "structural",
    dependencies: [],
  },
  {
    id: "MEP-342",
    name: "Level 4 duct installation",
    start: "2026-09-12",
    finish: "2026-09-16",
    durationDays: 4,
    trade: "mechanical",
    dependencies: ["STR-210"],
  },
  {
    id: "MEP-347",
    name: "Mechanical testing",
    start: "2026-09-17",
    finish: "2026-09-18",
    durationDays: 2,
    trade: "mechanical",
    dependencies: ["MEP-342"],
  },
  {
    id: "INS-118",
    name: "Above-ceiling inspection",
    start: "2026-09-19",
    finish: "2026-09-19",
    durationDays: 1,
    trade: "architectural",
    dependencies: ["MEP-347"],
  },
  {
    id: "FIN-402",
    name: "Ceiling close-up",
    start: "2026-09-20",
    finish: "2026-09-23",
    durationDays: 3,
    trade: "architectural",
    dependencies: ["INS-118"],
  },
]

export const contractsFixture: Contract[] = [
  {
    id: "MEP-04",
    name: "Mechanical package",
    trade: "mechanical",
    contractor: "Northline Mechanical",
    value: 1840000,
  },
  {
    id: "STR-02",
    name: "Structural package",
    trade: "structural",
    contractor: "Atlas Steel",
    value: 2260000,
  },
  {
    id: "ELEC-03",
    name: "Electrical package",
    trade: "electrical",
    contractor: "BrightGrid Electric",
    value: 1275000,
  },
]

export const baseResolutionOptionsFixture: ResolutionOption[] = [
  {
    id: "OPTION-A",
    strategy: "reroute",
    title: "Reroute through Corridor C",
    description: "Offset duct D22 around beam B14 using the east corridor bay.",
    revision: 1,
    routeOverlay: {
      id: "ROUTE-A-R1",
      drawingId: "M-204",
      label: "Original reroute path",
      points: [
        { x: 124, y: 250 },
        { x: 340, y: 250 },
        { x: 420, y: 180 },
        { x: 560, y: 250 },
        { x: 682, y: 250 },
      ],
    },
    costImpact: 4800,
    scheduleImpactDays: 1,
    risk: "medium",
    constraintIds: [],
    status: "available",
    fingerprint: "OPTION-A:r1:baseline",
  },
  {
    id: "OPTION-B",
    strategy: "resize",
    title: "Resize duct section",
    description: "Flatten the duct section through the conflict zone.",
    revision: 1,
    routeOverlay: {
      id: "ROUTE-B-R1",
      drawingId: "M-204",
      label: "Resize in place",
      points: [
        { x: 124, y: 222 },
        { x: 682, y: 222 },
      ],
    },
    costImpact: 2100,
    scheduleImpactDays: 0,
    risk: "high",
    constraintIds: [],
    status: "available",
    fingerprint: "OPTION-B:r1:baseline",
  },
  {
    id: "OPTION-C",
    strategy: "split",
    title: "Split supply run",
    description: "Split the supply run into two smaller branches around B14.",
    revision: 1,
    routeOverlay: {
      id: "ROUTE-C-R1",
      drawingId: "M-204",
      label: "Split route",
      points: [
        { x: 124, y: 250 },
        { x: 330, y: 250 },
        { x: 330, y: 326 },
        { x: 682, y: 326 },
      ],
    },
    costImpact: 6400,
    scheduleImpactDays: 2,
    risk: "low",
    constraintIds: [],
    status: "available",
    fingerprint: "OPTION-C:r1:baseline",
  },
]

export function createInitialDecisionState(now = "2026-09-02T10:00:00.000Z"): DecisionRoomState {
  return {
    phase: "INVESTIGATING",
    stateVersion: 1,
    project: projectFixture,
    activeIssue: activeIssueFixture,
    drawings: drawingsFixture,
    drawingElements: drawingElementsFixture,
    schedule: scheduleFixture,
    contracts: contractsFixture,
    activeDrawingId: "M-204",
    constraints: [],
    resolutionOptions: [],
    selectedOptionId: null,
    previewOptionId: null,
    activityLog: [
      {
        id: "ACT-001",
        type: "issue_loaded",
        label: "Issue loaded",
        detail: "ISS-019 requires a decision before MEP-342 can proceed.",
        createdAt: now,
      },
    ],
    lastError: null,
  }
}
