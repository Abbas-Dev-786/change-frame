export type DecisionPhase =
  | "INVESTIGATING"
  | "OPTIONS_AVAILABLE"
  | "OPTION_SELECTED"
  | "IMPACT_SIMULATED"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "CHANGE_ORDER_DRAFTED"

export type Severity = "low" | "medium" | "high"

export type DrawingElementType =
  | "duct"
  | "beam"
  | "riser"
  | "corridor"
  | "room"
  | "wall"

export type Trade = "mechanical" | "structural" | "electrical" | "architectural"

export type OptionId = "OPTION-A" | "OPTION-B" | "OPTION-C"

export type ConstraintId = "CONSTRAINT-12"

export type ResolutionStatus =
  | "available"
  | "needs_revision"
  | "revised"
  | "selected"

export type RiskLevel = "low" | "medium" | "high"

export type ActivityEventType =
  | "issue_loaded"
  | "options_evaluated"
  | "constraint_upserted"
  | "option_revised"
  | "option_selected"
  | "selection_changed"
  | "impact_simulated"
  | "decision_prepared"
  | "human_approved_decision"
  | "change_order_drafted"
  | "workflow_reset"

export type ToolErrorCode =
  | "INVALID_STATE"
  | "OPTION_NOT_FOUND"
  | "CONSTRAINT_NOT_FOUND"
  | "OPTION_NOT_SELECTED"
  | "SIMULATION_REQUIRED"
  | "HUMAN_APPROVAL_REQUIRED"
  | "STATE_CONFLICT"
  | "OPTION_REVISION_CONFLICT"

export type Point = {
  x: number
  y: number
}

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type Project = {
  id: "PROJECT-01"
  name: "Riverside Office Tower"
  budget: number
  currentForecast: number
}

export type Drawing = {
  id: "M-204" | "S-202" | "A-201"
  name: string
  discipline: Trade
  level: string
}

export type DrawingElement = {
  id: "DUCT-D22" | "BEAM-B14" | "RISER-E04" | "CORRIDOR-C3" | "ROOM-M401"
  type: DrawingElementType
  label: string
  drawingId: Drawing["id"]
  geometry: Rect
  trade: Trade
}

export type Issue = {
  id: "ISS-019"
  title: string
  description: string
  severity: Severity
  status: "Decision Required"
  drawingId: "M-204"
  location: string
  elementIds: DrawingElement["id"][]
  affectedActivityIds: string[]
  affectedContractIds: string[]
}

export type Constraint = {
  id: ConstraintId
  type: "blocked_region"
  label: string
  source: "human"
  drawingId: "M-204"
  geometry: Rect
  appliesTo: ["mechanical_route"]
  createdAt: string
  updatedAt: string
}

export type RouteOverlay = {
  id: string
  drawingId: "M-204"
  points: Point[]
  label: string
}

export type ResolutionOption = {
  id: OptionId
  strategy: "reroute" | "resize" | "split"
  title: string
  description: string
  revision: number
  routeOverlay: RouteOverlay
  costImpact: number
  scheduleImpactDays: number
  risk: RiskLevel
  constraintIds: ConstraintId[]
  status: ResolutionStatus
  fingerprint: string
}

export type ScheduleActivity = {
  id: string
  name: string
  start: string
  finish: string
  durationDays: number
  trade: Trade
  dependencies: string[]
}

export type Contract = {
  id: string
  name: string
  trade: Trade
  contractor: string
  value: number
}

export type Mitigation = {
  id: "MIT-001"
  type: "additional_mechanical_crew"
  label: "Add second MEP crew"
  additionalCost: number
  daysRecovered: number
}

export type ProjectImpactSimulation = {
  id: "SIM-019"
  optionId: OptionId
  optionRevision: number
  preserveInspectionMilestone: boolean
  baseChangeCost: number
  baseScheduleImpactDays: number
  mitigation: Mitigation | null
  totalCostImpact: number
  finalScheduleImpactDays: number
  projectedBudget: number
  fingerprint: string
}

export type Decision = {
  id: "DEC-019"
  issueId: "ISS-019"
  optionId: OptionId
  mitigationId: Mitigation["id"] | null
  costImpact: number
  scheduleImpactDays: number
  status: "READY_FOR_APPROVAL" | "APPROVED"
  approvedAt: string | null
  sourceStateVersion: number
  simulationFingerprint: string
}

export type ChangeOrder = {
  id: "CO-007"
  decisionId: "DEC-019"
  reason: string
  scope: string
  costImpact: number
  scheduleImpactDays: number
  status: "draft"
  sourceDecisionVersion: number
}

export type ActivityEvent = {
  id: string
  type: ActivityEventType
  label: string
  detail: string
  createdAt: string
}

export type DecisionRoomState = {
  phase: DecisionPhase
  stateVersion: number
  project: Project
  activeIssue: Issue
  drawings: Drawing[]
  drawingElements: DrawingElement[]
  schedule: ScheduleActivity[]
  contracts: Contract[]
  activeDrawingId: "M-204"
  constraints: Constraint[]
  resolutionOptions: ResolutionOption[]
  selectedOptionId: OptionId | null
  previewOptionId: OptionId | null
  impactSimulation: ProjectImpactSimulation | null
  decision: Decision | null
  changeOrder: ChangeOrder | null
  activityLog: ActivityEvent[]
  lastError: ToolErrorCode | null
}

export type DomainSuccess = {
  success: true
  state: DecisionRoomState
  changed: boolean
}

export type DomainFailure = {
  success: false
  state: DecisionRoomState
  error: ToolErrorCode
  message: string
  retryable: boolean
}

export type DomainResult = DomainSuccess | DomainFailure
