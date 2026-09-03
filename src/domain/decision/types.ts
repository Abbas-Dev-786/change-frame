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
  | "pipe"
  | "cable_tray"
  | "equipment"
  | "generic"

export type Trade =
  | "mechanical"
  | "structural"
  | "electrical"
  | "architectural"
  | "plumbing"
  | "fire_protection"
  | "civil"
  | "general"

export type OptionId = string
export type ConstraintId = string

export type ResolutionStatus =
  | "available"
  | "needs_revision"
  | "revised"
  | "rejected"
  | "selected"

export type OptionRejectionReason =
  | "too_risky"
  | "too_expensive"
  | "schedule_exposure"
  | "violates_field_constraint"
  | "requires_engineering_review"

export type RiskLevel = "low" | "medium" | "high"

export type ActivityEventType =
  | "context_configured"
  | "issue_loaded"
  | "options_evaluated"
  | "constraint_upserted"
  | "option_revised"
  | "option_rejected"
  | "option_selected"
  | "selection_changed"
  | "impact_simulated"
  | "decision_prepared"
  | "human_approved_decision"
  | "change_order_drafted"
  | "workflow_reset"

export type ToolErrorCode =
  | "CONTEXT_REQUIRED"
  | "INVALID_CONTEXT"
  | "INVALID_STATE"
  | "INVALID_OPTIONS"
  | "OPTION_NOT_FOUND"
  | "CONSTRAINT_NOT_FOUND"
  | "OPTION_NOT_SELECTED"
  | "SIMULATION_REQUIRED"
  | "HUMAN_APPROVAL_REQUIRED"
  | "STATE_CONFLICT"
  | "OPTION_REVISION_CONFLICT"
  | "INVALID_CONSTRAINT_GEOMETRY"
  | "UNSUPPORTED_CONSTRAINT_GEOMETRY"

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; width: number; height: number }
export type PlanViewBox = { width: number; height: number }

export type Project = {
  id: string
  name: string
  budget: number
  currentForecast: number
  currency: string
}

export type Drawing = {
  id: string
  name: string
  discipline: Trade
  level: string
}

export type DrawingElement = {
  id: string
  type: DrawingElementType
  label: string
  drawingId: string
  geometry: Rect
  trade: Trade
}

export type Issue = {
  id: string
  title: string
  description: string
  severity: Severity
  status: string
  drawingId: string
  location: string
  elementIds: string[]
  affectedActivityIds: string[]
  affectedContractIds: string[]
}

export type BaselineConstraint = { id: string; type: string; label: string }

export type Constraint = {
  id: ConstraintId
  type: "blocked_region"
  label: string
  source: "human"
  drawingId: string
  geometry: Rect
  appliesTo: string[]
  createdAt: string
  updatedAt: string
}

export type RouteOverlay = {
  id: string
  drawingId: string
  points: Point[]
  label: string
}

export type AgentOptionProposal = {
  id: string
  strategy: string
  title: string
  description: string
  rationale: string
  assumptions: string[]
  confidence: number
  costImpact: number
  scheduleImpactDays: number
  risk: RiskLevel
  route: { label: string; points: Point[] } | null
}

export type ResolutionOption = {
  id: OptionId
  strategy: string
  title: string
  description: string
  rationale: string
  assumptions: string[]
  confidence: number
  revision: number
  routeOverlay: RouteOverlay | null
  costImpact: number
  scheduleImpactDays: number
  risk: RiskLevel
  constraintIds: ConstraintId[]
  status: ResolutionStatus
  rejectionReason: OptionRejectionReason | null
  fingerprint: string
  authoredBy: "agent"
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

export type AgentMitigationProposal = {
  id: string
  type: string
  label: string
  rationale: string
  additionalCost: number
  daysRecovered: number
  confidence: number
}

export type Mitigation = AgentMitigationProposal & { authoredBy: "agent" }

export type ProjectImpactSimulation = {
  id: string
  optionId: OptionId
  optionRevision: number
  mitigation: Mitigation | null
  totalCostImpact: number
  finalScheduleImpactDays: number
  projectedBudget: number
  fingerprint: string
}

export type Decision = {
  id: string
  issueId: string
  optionId: OptionId
  optionRevision: number
  mitigationId: string | null
  costImpact: number
  scheduleImpactDays: number
  status: "READY_FOR_APPROVAL" | "APPROVED"
  approvedAt: string | null
  sourceStateVersion: number
  simulationFingerprint: string
}

export type ChangeOrder = {
  id: string
  decisionId: string
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
  contextConfigured: boolean
  contextSource: "starter" | "human" | "agent"
  project: Project
  activeIssue: Issue
  drawings: Drawing[]
  drawingElements: DrawingElement[]
  schedule: ScheduleActivity[]
  contracts: Contract[]
  baselineConstraints: BaselineConstraint[]
  planViewBox: PlanViewBox
  activeDrawingId: string
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

export type DecisionContextInput = Pick<
  DecisionRoomState,
  | "project"
  | "activeIssue"
  | "drawings"
  | "drawingElements"
  | "schedule"
  | "contracts"
  | "baselineConstraints"
  | "planViewBox"
  | "activeDrawingId"
> & {
  expectedStateVersion: number
  source: "human" | "agent"
}

export type DomainSuccess = { success: true; state: DecisionRoomState; changed: boolean }
export type DomainFailure = {
  success: false
  state: DecisionRoomState
  error: ToolErrorCode
  message: string
  retryable: boolean
}
export type DomainResult = DomainSuccess | DomainFailure
