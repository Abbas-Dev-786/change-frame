import { clampRectToPlan, routeIntersectsRect } from "./geometry"
import type {
  AgentMitigationProposal,
  AgentOptionProposal,
  Constraint,
  DecisionContextInput,
  DecisionPhase,
  DecisionRoomState,
  DomainFailure,
  DomainResult,
  DomainSuccess,
  OptionId,
  OptionRejectionReason,
  Rect,
  ResolutionOption,
  ToolErrorCode,
} from "./types"

export type ConstraintDraft = { label: string; geometry: Rect }
export type ExpectedVersionInput = { expectedStateVersion: number }
export type EvaluateOptionsInput = ExpectedVersionInput & { options: AgentOptionProposal[] }
export type RevisionInput = ExpectedVersionInput & {
  optionId: OptionId
  constraintIds: string[]
  expectedOptionRevision: number
  revision: Omit<AgentOptionProposal, "id">
}
export type SimulateImpactInput = ExpectedVersionInput & {
  mitigation: AgentMitigationProposal | null
}
export type RejectionInput = { optionId: OptionId; reason: OptionRejectionReason }

export function configureDecisionContext(
  state: DecisionRoomState,
  input: DecisionContextInput,
  now = new Date().toISOString(),
): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)
  if (conflict) return conflict

  if (state.phase !== "INVESTIGATING" || state.resolutionOptions.length > 0) {
    return failure(state, "INVALID_STATE", "Reset the workspace before replacing project context.", false)
  }

  const contextError = validateDecisionContext(input)
  if (contextError) return failure(state, "INVALID_CONTEXT", contextError, false)

  return success(withActivity({
    ...state,
    stateVersion: state.stateVersion + 1,
    contextConfigured: true,
    contextSource: input.source,
    project: input.project,
    activeIssue: input.activeIssue,
    drawings: input.drawings,
    drawingElements: input.drawingElements,
    schedule: input.schedule,
    contracts: input.contracts,
    baselineConstraints: input.baselineConstraints,
    planViewBox: input.planViewBox,
    activeDrawingId: input.activeDrawingId,
    constraints: [],
    resolutionOptions: [],
    selectedOptionId: null,
    previewOptionId: null,
    impactSimulation: null,
    decision: null,
    changeOrder: null,
    lastError: null,
  }, "context_configured", "Live context configured", `${input.activeIssue.id} loaded from ${input.source}-provided project data.`, now), true)
}

export function evaluateResolutionOptions(
  state: DecisionRoomState,
  input: EvaluateOptionsInput,
  now = new Date().toISOString(),
): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)
  if (conflict) return conflict
  if (!state.contextConfigured) {
    return failure(state, "CONTEXT_REQUIRED", "Configure project context before proposing alternatives.", false)
  }
  if (state.phase !== "INVESTIGATING") {
    return failure(state, "INVALID_STATE", "Alternatives can only be proposed while investigating.", false)
  }
  const optionsError = validateOptionProposals(input.options, state)
  if (optionsError) return failure(state, "INVALID_OPTIONS", optionsError, false)

  const materialized = input.options.map((proposal) => materializeOption(proposal, state.activeDrawingId))
  return success(withActivity({
    ...state,
    phase: "OPTIONS_AVAILABLE",
    stateVersion: state.stateVersion + 1,
    resolutionOptions: materialized,
    previewOptionId: materialized[0]?.id ?? null,
    lastError: null,
  }, "options_evaluated", "Agent alternatives proposed", `${materialized.length} original alternatives were authored for ${state.activeIssue.id}.`, now), true)
}

export function upsertHumanConstraint(
  state: DecisionRoomState,
  draft: ConstraintDraft,
  now = new Date().toISOString(),
): DomainResult {
  if (!canMutateBeforeApproval(state.phase)) {
    return failure(state, "INVALID_STATE", "Constraints are read-only after approval.", false)
  }
  if (state.resolutionOptions.length === 0) {
    return failure(state, "INVALID_STATE", "Agent-authored alternatives are required before adding a plan constraint.", false)
  }
  if (!isFinitePositiveRect(draft.geometry)) {
    return failure(state, "INVALID_CONSTRAINT_GEOMETRY", "Constraint geometry must use finite coordinates and positive dimensions.", false)
  }

  const existingConstraint = state.constraints[0]
  const nextConstraint: Constraint = {
    id: existingConstraint?.id ?? "CONSTRAINT-1",
    type: "blocked_region",
    source: "human",
    drawingId: state.activeDrawingId,
    appliesTo: ["route"],
    label: sanitizeText(draft.label, 60, "Field constraint"),
    geometry: clampRectToPlan(draft.geometry, state.planViewBox),
    createdAt: existingConstraint?.createdAt ?? now,
    updatedAt: now,
  }
  if (existingConstraint && constraintFingerprint(existingConstraint) === constraintFingerprint(nextConstraint)) {
    return success(state, false)
  }

  const markedOptions = state.resolutionOptions.map((option) => ({
    ...option,
    status: option.status === "rejected"
      ? option.status
      : option.routeOverlay && routeIntersectsRect(option.routeOverlay, nextConstraint.geometry)
        ? "needs_revision" as const
        : option.status === "selected" ? "available" as const : option.status,
  }))

  return success(withActivity({
    ...state,
    phase: "OPTIONS_AVAILABLE",
    stateVersion: state.stateVersion + 1,
    constraints: [nextConstraint],
    resolutionOptions: markedOptions,
    selectedOptionId: null,
    previewOptionId: markedOptions.find((option) => option.status === "needs_revision")?.id ?? markedOptions[0]?.id ?? null,
    impactSimulation: null,
    decision: null,
    changeOrder: null,
    lastError: null,
  }, "constraint_upserted", existingConstraint ? "Constraint replaced" : "Constraint added", `${nextConstraint.label} captured as ${nextConstraint.id}.`, now), true)
}

export function reviseResolutionOption(
  state: DecisionRoomState,
  input: RevisionInput,
  now = new Date().toISOString(),
): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)
  if (conflict) return conflict
  if (!canMutateBeforeApproval(state.phase)) {
    return failure(state, "INVALID_STATE", "Alternatives cannot be revised after approval.", false)
  }
  const option = state.resolutionOptions.find((candidate) => candidate.id === input.optionId)
  if (!option) return failure(state, "OPTION_NOT_FOUND", `Alternative ${input.optionId} does not exist.`, false)
  if (option.revision !== input.expectedOptionRevision) {
    return failure(state, "OPTION_REVISION_CONFLICT", "The alternative revision changed. Read current context before retrying.", true)
  }
  if (option.status === "rejected") return failure(state, "INVALID_STATE", "Rejected alternatives cannot be revised.", false)

  const constraints = input.constraintIds.map((id) => state.constraints.find((constraint) => constraint.id === id))
  if (constraints.length === 0 || constraints.some((constraint) => !constraint)) {
    return failure(state, "CONSTRAINT_NOT_FOUND", "Every referenced human constraint must exist in current state.", false)
  }

  const proposal = { ...input.revision, id: input.optionId }
  const optionsError = validateOptionProposals([proposal], state, 1)
  if (optionsError) return failure(state, "INVALID_OPTIONS", optionsError, false)
  const revisedOption = materializeOption(proposal, state.activeDrawingId, option.revision + 1, input.constraintIds)

  if (!revisedOption.routeOverlay) {
    return failure(state, "UNSUPPORTED_CONSTRAINT_GEOMETRY", "A revised route is required to prove that the alternative clears the field constraint.", false)
  }
  if (constraints.some((constraint) => constraint && routeIntersectsRect(revisedOption.routeOverlay!, constraint.geometry))) {
    return failure(state, "UNSUPPORTED_CONSTRAINT_GEOMETRY", "The proposed revision still intersects a referenced human constraint.", false)
  }

  return success(withActivity({
    ...state,
    phase: "OPTIONS_AVAILABLE",
    stateVersion: state.stateVersion + 1,
    resolutionOptions: state.resolutionOptions.map((candidate) => candidate.id === option.id ? { ...revisedOption, status: "revised" } : candidate),
    selectedOptionId: null,
    previewOptionId: option.id,
    impactSimulation: null,
    decision: null,
    changeOrder: null,
    lastError: null,
  }, "option_revised", "Agent revision validated", `${option.id} revision ${option.revision + 1} clears ${input.constraintIds.join(", ")}.`, now), true)
}

export function selectResolutionOption(state: DecisionRoomState, optionId: OptionId, now = new Date().toISOString()): DomainResult {
  if (!["OPTIONS_AVAILABLE", "OPTION_SELECTED", "IMPACT_SIMULATED"].includes(state.phase)) {
    return failure(state, "INVALID_STATE", "Alternatives can only be selected before approval preparation.", false)
  }
  const option = state.resolutionOptions.find((candidate) => candidate.id === optionId)
  if (!option) return failure(state, "OPTION_NOT_FOUND", `Alternative ${optionId} does not exist.`, false)
  if (!isOptionEligibleForSelection(option)) {
    return failure(state, "INVALID_STATE", option.status === "needs_revision" ? "This route intersects a human constraint and must be revised first." : "Rejected alternatives cannot be selected.", false)
  }
  if (state.selectedOptionId === optionId && state.phase === "OPTION_SELECTED") return success(state, false)

  return success(withActivity({
    ...state,
    phase: "OPTION_SELECTED",
    stateVersion: state.stateVersion + 1,
    selectedOptionId: optionId,
    previewOptionId: optionId,
    impactSimulation: null,
    decision: null,
    changeOrder: null,
    resolutionOptions: state.resolutionOptions.map((candidate) => ({
      ...candidate,
      status: candidate.id === optionId ? "selected" : candidate.status === "selected" ? "available" : candidate.status,
    })),
    lastError: null,
  }, state.selectedOptionId ? "selection_changed" : "option_selected", state.selectedOptionId ? "Selection changed" : "Alternative selected", `${optionId} selected by the human reviewer.`, now), true)
}

export function rejectResolutionOption(state: DecisionRoomState, input: RejectionInput, now = new Date().toISOString()): DomainResult {
  if (!["OPTIONS_AVAILABLE", "OPTION_SELECTED", "IMPACT_SIMULATED"].includes(state.phase)) {
    return failure(state, "INVALID_STATE", "Alternatives can only be rejected before approval preparation.", false)
  }
  const option = state.resolutionOptions.find((candidate) => candidate.id === input.optionId)
  if (!option) return failure(state, "OPTION_NOT_FOUND", `Alternative ${input.optionId} does not exist.`, false)
  if (option.status === "rejected" && option.rejectionReason === input.reason) return success(state, false)
  const rejectsSelected = state.selectedOptionId === input.optionId
  return success(withActivity({
    ...state,
    phase: rejectsSelected ? "OPTIONS_AVAILABLE" : state.phase,
    stateVersion: state.stateVersion + 1,
    resolutionOptions: state.resolutionOptions.map((candidate) => candidate.id === input.optionId ? { ...candidate, status: "rejected", rejectionReason: input.reason } : candidate),
    selectedOptionId: rejectsSelected ? null : state.selectedOptionId,
    previewOptionId: input.optionId,
    impactSimulation: rejectsSelected ? null : state.impactSimulation,
    decision: rejectsSelected ? null : state.decision,
    changeOrder: rejectsSelected ? null : state.changeOrder,
    lastError: null,
  }, "option_rejected", "Alternative rejected", `${input.optionId} rejected: ${formatRejectionReason(input.reason)}.`, now), true)
}

export function simulateProjectImpact(state: DecisionRoomState, input: SimulateImpactInput, now = new Date().toISOString()): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)
  if (conflict) return conflict
  if (!["OPTION_SELECTED", "IMPACT_SIMULATED"].includes(state.phase) || !state.selectedOptionId) {
    return failure(state, "OPTION_NOT_SELECTED", "A human-selected alternative is required before impact calculation.", false)
  }
  const option = state.resolutionOptions.find((candidate) => candidate.id === state.selectedOptionId)
  if (!option) return failure(state, "OPTION_NOT_FOUND", "The selected alternative is unavailable.", false)
  if (input.mitigation && !isValidMitigation(input.mitigation)) {
    return failure(state, "INVALID_OPTIONS", "Mitigation values, rationale, and confidence must be valid and finite.", false)
  }

  const mitigation = input.mitigation ? { ...input.mitigation, authoredBy: "agent" as const } : null
  const fingerprint = stableFingerprint({ option: option.fingerprint, mitigation })
  if (state.impactSimulation?.fingerprint === fingerprint) return success(state, false)
  const totalCostImpact = option.costImpact + (mitigation?.additionalCost ?? 0)
  const finalScheduleImpactDays = Math.max(0, option.scheduleImpactDays - (mitigation?.daysRecovered ?? 0))
  const simulation = {
    id: `SIM-${safeId(state.activeIssue.id)}`,
    optionId: option.id,
    optionRevision: option.revision,
    mitigation,
    totalCostImpact,
    finalScheduleImpactDays,
    projectedBudget: state.project.currentForecast + totalCostImpact,
    fingerprint,
  }
  return success(withActivity({ ...state, phase: "IMPACT_SIMULATED", stateVersion: state.stateVersion + 1, impactSimulation: simulation, decision: null, changeOrder: null, lastError: null }, "impact_simulated", "Impact calculated", `${formatSignedCurrency(totalCostImpact, state.project.currency)} and ${formatScheduleImpact(finalScheduleImpactDays)} after agent-authored assumptions.`, now), true)
}

export function prepareChangeDecision(state: DecisionRoomState, input: ExpectedVersionInput, now = new Date().toISOString()): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)
  if (conflict) return conflict
  if (state.phase !== "IMPACT_SIMULATED" || !state.impactSimulation) {
    return failure(state, "SIMULATION_REQUIRED", "Calculate project impact before preparing the decision.", false)
  }
  const decisionId = `DEC-${safeId(state.activeIssue.id)}`
  return success(withActivity({
    ...state,
    phase: "READY_FOR_APPROVAL",
    stateVersion: state.stateVersion + 1,
    decision: {
      id: decisionId,
      issueId: state.activeIssue.id,
      optionId: state.impactSimulation.optionId,
      optionRevision: state.impactSimulation.optionRevision,
      mitigationId: state.impactSimulation.mitigation?.id ?? null,
      costImpact: state.impactSimulation.totalCostImpact,
      scheduleImpactDays: state.impactSimulation.finalScheduleImpactDays,
      status: "READY_FOR_APPROVAL",
      approvedAt: null,
      sourceStateVersion: state.stateVersion,
      simulationFingerprint: state.impactSimulation.fingerprint,
    },
    changeOrder: null,
    lastError: null,
  }, "decision_prepared", "Decision prepared", `${decisionId} is ready for human approval.`, now), true)
}

export function approveDecisionByHuman(state: DecisionRoomState, now = new Date().toISOString()): DomainResult {
  if (state.phase !== "READY_FOR_APPROVAL" || !state.decision) {
    return failure(state, "INVALID_STATE", "Human approval is enabled only when a decision is ready for approval.", false)
  }
  if (state.decision.approvedAt) return success(state, false)
  return success(withActivity({ ...state, phase: "APPROVED", stateVersion: state.stateVersion + 1, decision: { ...state.decision, status: "APPROVED", approvedAt: now }, lastError: null }, "human_approved_decision", "Decision approved", `${state.decision.id} approved by the human project manager.`, now), true)
}

export function draftChangeOrder(state: DecisionRoomState, input: ExpectedVersionInput, now = new Date().toISOString()): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)
  if (conflict) return conflict
  if (!["APPROVED", "CHANGE_ORDER_DRAFTED"].includes(state.phase) || !state.decision?.approvedAt) {
    return failure(state, "HUMAN_APPROVAL_REQUIRED", "Human approval is required before drafting a change order.", false)
  }
  const option = state.resolutionOptions.find((candidate) => candidate.id === state.decision?.optionId)
  if (!option || option.revision !== state.decision.optionRevision) return failure(state, "OPTION_NOT_FOUND", "The approved alternative revision is unavailable.", false)
  const changeOrder = {
    id: `CO-${safeId(state.activeIssue.id)}`,
    decisionId: state.decision.id,
    reason: state.activeIssue.description,
    scope: `${option.description}${state.impactSimulation?.mitigation ? ` Mitigation: ${state.impactSimulation.mitigation.label}.` : ""}`,
    costImpact: state.decision.costImpact,
    scheduleImpactDays: state.decision.scheduleImpactDays,
    status: "draft" as const,
    sourceDecisionVersion: state.stateVersion,
  }
  if (state.changeOrder?.decisionId === changeOrder.decisionId) return success(state, false)
  return success(withActivity({ ...state, phase: "CHANGE_ORDER_DRAFTED", stateVersion: state.stateVersion + 1, changeOrder, lastError: null }, "change_order_drafted", "Change order drafted", `${changeOrder.id} created from approved ${state.decision.id}.`, now), true)
}

export function setPreviewOption(state: DecisionRoomState, optionId: OptionId | null): DecisionRoomState {
  return state.previewOptionId === optionId ? state : { ...state, previewOptionId: optionId }
}

export function resetDecisionRoom(currentState: DecisionRoomState, createInitial: () => DecisionRoomState, now = new Date().toISOString()): DecisionRoomState {
  return withActivity({ ...createInitial(), stateVersion: currentState.stateVersion + 1 }, "workflow_reset", "Workspace reset", "Cleared project context and returned to an open decision workspace.", now)
}

export function getPreviewedOption(state: DecisionRoomState): ResolutionOption | null {
  const targetId = state.previewOptionId ?? state.selectedOptionId
  return targetId ? state.resolutionOptions.find((option) => option.id === targetId) ?? null : null
}

export function isOptionEligibleForSelection(option: ResolutionOption): boolean {
  return option.status === "available" || option.status === "revised" || option.status === "selected"
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value)
}

export function formatSignedCurrency(value: number, currency = "USD"): string {
  return value >= 0 ? `+${formatCurrency(value, currency)}` : formatCurrency(value, currency)
}

export function formatScheduleImpact(days: number): string {
  if (days === 0) return "0 days"
  return days > 0 ? `+${days} day${days === 1 ? "" : "s"}` : `${days} days`
}

export function formatRejectionReason(reason: OptionRejectionReason): string {
  return ({
    too_risky: "Too risky",
    too_expensive: "Too expensive",
    schedule_exposure: "Schedule exposure too high",
    violates_field_constraint: "Violates field constraint",
    requires_engineering_review: "Requires engineering review",
  })[reason]
}

function validateDecisionContext(input: DecisionContextInput): string | null {
  if (!input.project.id.trim() || !input.project.name.trim() || !input.activeIssue.id.trim() || !input.activeIssue.title.trim()) return "Project and issue IDs and names are required."
  if (![input.project.budget, input.project.currentForecast, input.planViewBox.width, input.planViewBox.height].every(Number.isFinite)) return "Budget, forecast, and view-box values must be finite."
  if (input.project.budget < 0 || input.project.currentForecast < 0 || input.planViewBox.width < 100 || input.planViewBox.height < 100) return "Budgets must be non-negative and the decision canvas must be at least 100 by 100."
  if (!input.drawings.some((drawing) => drawing.id === input.activeDrawingId)) return "The active drawing must exist in drawings."
  if (input.activeIssue.drawingId !== input.activeDrawingId) return "The active issue must reference the active drawing."
  if (input.drawingElements.some((element) => element.drawingId !== input.activeDrawingId || !isFinitePositiveRect(element.geometry))) return "Every drawing element must have valid geometry on the active drawing."
  if (input.activeIssue.elementIds.some((id) => !input.drawingElements.some((element) => element.id === id))) return "Issue element references must exist in drawing elements."
  if (input.activeIssue.affectedActivityIds.some((id) => !input.schedule.some((activity) => activity.id === id))) return "Affected activity references must exist in the schedule."
  if (input.activeIssue.affectedContractIds.some((id) => !input.contracts.some((contract) => contract.id === id))) return "Affected contract references must exist in contracts."
  return null
}

function validateOptionProposals(proposals: AgentOptionProposal[], state: DecisionRoomState, minimum = 2): string | null {
  if (proposals.length < minimum || proposals.length > 5) return `Submit ${minimum === 1 ? "one" : "2"} to 5 alternatives.`
  if (new Set(proposals.map((proposal) => proposal.id)).size !== proposals.length) return "Alternative IDs must be unique."
  for (const proposal of proposals) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/.test(proposal.id)) return "Alternative IDs must contain 2-40 letters, numbers, underscores, or hyphens."
    if (![proposal.title, proposal.description, proposal.strategy, proposal.rationale].every((value) => value.trim().length > 0)) return "Each alternative needs a title, strategy, description, and rationale."
    if (!Number.isFinite(proposal.costImpact) || !Number.isInteger(proposal.scheduleImpactDays) || proposal.scheduleImpactDays < 0) return "Cost must be finite and schedule impact must be a non-negative whole number."
    if (!Number.isFinite(proposal.confidence) || proposal.confidence < 0 || proposal.confidence > 1) return "Confidence must be between 0 and 1."
    if (proposal.route && (proposal.route.points.length < 2 || proposal.route.points.some((point) => !pointInViewBox(point, state)))) return "Route points must contain at least two finite points inside the active canvas."
  }
  return null
}

function materializeOption(proposal: AgentOptionProposal, drawingId: string, revision = 1, constraintIds: string[] = []): ResolutionOption {
  const normalized = {
    ...proposal,
    title: sanitizeText(proposal.title, 100, "Agent alternative"),
    description: sanitizeText(proposal.description, 500, "No description supplied"),
    strategy: sanitizeText(proposal.strategy, 60, "custom"),
    rationale: sanitizeText(proposal.rationale, 800, "No rationale supplied"),
    assumptions: proposal.assumptions.slice(0, 8).map((assumption) => sanitizeText(assumption, 180, "Unspecified assumption")),
  }
  return {
    id: proposal.id,
    strategy: normalized.strategy,
    title: normalized.title,
    description: normalized.description,
    rationale: normalized.rationale,
    assumptions: normalized.assumptions,
    confidence: proposal.confidence,
    revision,
    routeOverlay: proposal.route ? { id: `${proposal.id}-ROUTE-R${revision}`, drawingId, label: sanitizeText(proposal.route.label, 100, `${proposal.id} route`), points: proposal.route.points } : null,
    costImpact: proposal.costImpact,
    scheduleImpactDays: proposal.scheduleImpactDays,
    risk: proposal.risk,
    constraintIds,
    status: revision > 1 ? "revised" : "available",
    rejectionReason: null,
    fingerprint: stableFingerprint({ ...normalized, revision, constraintIds }),
    authoredBy: "agent",
  }
}

function isValidMitigation(mitigation: AgentMitigationProposal): boolean {
  return Boolean(mitigation.id.trim() && mitigation.label.trim() && mitigation.type.trim() && mitigation.rationale.trim()) &&
    Number.isFinite(mitigation.additionalCost) && Number.isInteger(mitigation.daysRecovered) && mitigation.daysRecovered >= 0 &&
    Number.isFinite(mitigation.confidence) && mitigation.confidence >= 0 && mitigation.confidence <= 1
}

function pointInViewBox(point: { x: number; y: number }, state: DecisionRoomState): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.y >= 0 && point.x <= state.planViewBox.width && point.y <= state.planViewBox.height
}

function validateExpectedVersion(state: DecisionRoomState, expectedStateVersion: number): DomainFailure | null {
  return state.stateVersion === expectedStateVersion ? null : failure(state, "STATE_CONFLICT", "The decision changed. Read current context and retry.", true)
}

function sanitizeText(value: string, maxLength: number, fallback: string): string {
  const sanitized = value.trim().replace(/\s+/g, " ")
  return (sanitized || fallback).slice(0, maxLength)
}

function safeId(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "DECISION"
}

function stableFingerprint(value: unknown): string {
  const json = JSON.stringify(value)
  let hash = 2166136261
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

function constraintFingerprint(constraint: Constraint): string {
  return stableFingerprint({ label: constraint.label, geometry: constraint.geometry, drawingId: constraint.drawingId, appliesTo: constraint.appliesTo })
}

function isFinitePositiveRect(rect: Rect): boolean {
  return [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) && rect.width > 0 && rect.height > 0
}

function canMutateBeforeApproval(phase: DecisionPhase): boolean {
  return !["APPROVED", "CHANGE_ORDER_DRAFTED"].includes(phase)
}

function withActivity(state: DecisionRoomState, type: Parameters<typeof makeActivity>[1], label: string, detail: string, now: string): DecisionRoomState {
  return { ...state, activityLog: [makeActivity(state.activityLog.length + 1, type, label, detail, now), ...state.activityLog] }
}

function makeActivity(index: number, type: import("./types").ActivityEventType, label: string, detail: string, now: string) {
  return { id: `ACT-${String(index).padStart(3, "0")}`, type, label, detail, createdAt: now }
}

function success(state: DecisionRoomState, changed: boolean): DomainSuccess {
  return { success: true, state, changed }
}

function failure(state: DecisionRoomState, error: ToolErrorCode, message: string, retryable: boolean): DomainFailure {
  return { success: false, state: { ...state, lastError: error }, error, message, retryable }
}
