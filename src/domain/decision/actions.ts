import { baseResolutionOptionsFixture } from "./fixtures"
import { clampRectToPlan, routeIntersectsRect } from "./geometry"
import type {
  Constraint,
  DecisionPhase,
  DecisionRoomState,
  DomainFailure,
  DomainResult,
  DomainSuccess,
  Mitigation,
  OptionId,
  Rect,
  ResolutionOption,
  ToolErrorCode,
} from "./types"

export type ConstraintDraft = {
  label: string
  geometry: Rect
}

export type ExpectedVersionInput = {
  expectedStateVersion: number
}

export type RevisionInput = ExpectedVersionInput & {
  optionId: OptionId
  expectedOptionRevision: number
}

export type SimulateImpactInput = ExpectedVersionInput & {
  preserveInspectionMilestone: boolean
}

export function evaluateResolutionOptions(
  state: DecisionRoomState,
  input: ExpectedVersionInput,
  now = new Date().toISOString(),
): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)

  if (conflict) {
    return conflict
  }

  if (state.resolutionOptions.length === 3) {
    return success(state, false)
  }

  if (state.phase !== "INVESTIGATING") {
    return failure(
      state,
      "INVALID_STATE",
      "Resolution options can only be evaluated while investigating.",
      false,
    )
  }

  return success(
    withActivity(
      {
        ...state,
        phase: "OPTIONS_AVAILABLE",
        stateVersion: state.stateVersion + 1,
        resolutionOptions: baseResolutionOptionsFixture,
        previewOptionId: "OPTION-A",
        lastError: null,
      },
      "options_evaluated",
      "Options evaluated",
      "Materialized OPTION-A, OPTION-B, and OPTION-C.",
      now,
    ),
    true,
  )
}

export function upsertHumanConstraint(
  state: DecisionRoomState,
  draft: ConstraintDraft,
  now = new Date().toISOString(),
): DomainResult {
  if (!canMutateBeforeApproval(state.phase)) {
    return failure(
      state,
      "INVALID_STATE",
      "Constraints are read-only after approval.",
      false,
    )
  }

  if (state.resolutionOptions.length === 0) {
    return failure(
      state,
      "INVALID_STATE",
      "Create resolution options before adding a plan constraint.",
      false,
    )
  }

  const existingConstraint = state.constraints.find((constraint) => constraint.id === "CONSTRAINT-12")
  const sanitizedLabel = sanitizeConstraintLabel(draft.label)
  const geometry = clampRectToPlan(draft.geometry)
  const nextConstraint: Constraint = {
    id: "CONSTRAINT-12",
    type: "blocked_region",
    source: "human",
    drawingId: "M-204",
    appliesTo: ["mechanical_route"],
    label: sanitizedLabel,
    geometry,
    createdAt: existingConstraint?.createdAt ?? now,
    updatedAt: now,
  }

  const existingFingerprint = existingConstraint
    ? constraintFingerprint(existingConstraint)
    : null
  const nextFingerprint = constraintFingerprint(nextConstraint)

  if (existingFingerprint === nextFingerprint) {
    return success(state, false)
  }

  const markedOptions = state.resolutionOptions.map((option) => ({
    ...option,
    status:
      option.id === "OPTION-A" && option.revision === 1
        ? "needs_revision"
        : option.status === "selected"
          ? "available"
          : option.status,
  }))

  return success(
    withActivity(
      {
        ...state,
        phase: "OPTIONS_AVAILABLE",
        stateVersion: state.stateVersion + 1,
        constraints: [nextConstraint],
        resolutionOptions: markedOptions,
        selectedOptionId: null,
        previewOptionId: "OPTION-A",
        impactSimulation: null,
        decision: null,
        changeOrder: null,
        lastError: null,
      },
      "constraint_upserted",
      existingConstraint ? "Constraint replaced" : "Constraint added",
      `${sanitizedLabel} captured as CONSTRAINT-12.`,
      now,
    ),
    true,
  )
}

export function reviseResolutionOption(
  state: DecisionRoomState,
  input: RevisionInput,
  now = new Date().toISOString(),
): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)

  if (conflict) {
    return conflict
  }

  if (!canMutateBeforeApproval(state.phase)) {
    return failure(
      state,
      "INVALID_STATE",
      "Resolution options cannot be revised after approval.",
      false,
    )
  }

  const constraint = state.constraints.find((candidate) => candidate.id === "CONSTRAINT-12")

  if (!constraint) {
    return failure(
      state,
      "CONSTRAINT_NOT_FOUND",
      "CONSTRAINT-12 is required before revising an option.",
      false,
    )
  }

  const option = state.resolutionOptions.find((candidate) => candidate.id === input.optionId)

  if (!option) {
    return failure(
      state,
      "OPTION_NOT_FOUND",
      `Resolution option ${input.optionId} does not exist.`,
      false,
    )
  }

  if (option.revision !== input.expectedOptionRevision) {
    return failure(
      state,
      "OPTION_REVISION_CONFLICT",
      "The option revision changed. Read the current option before retrying.",
      true,
    )
  }

  const revisedOption = reviseOptionAgainstConstraint(option, constraint)

  if (option.fingerprint === revisedOption.fingerprint) {
    return success(state, false)
  }

  return success(
    withActivity(
      {
        ...state,
        phase: "OPTIONS_AVAILABLE",
        stateVersion: state.stateVersion + 1,
        resolutionOptions: state.resolutionOptions.map((candidate) =>
          candidate.id === option.id ? revisedOption : candidate,
        ),
        selectedOptionId: null,
        previewOptionId: option.id,
        impactSimulation: null,
        decision: null,
        changeOrder: null,
        lastError: null,
      },
      "option_revised",
      "Option revised",
      `${option.id} now routes through Corridor C East and avoids CONSTRAINT-12.`,
      now,
    ),
    true,
  )
}

export function selectResolutionOption(
  state: DecisionRoomState,
  optionId: OptionId,
  now = new Date().toISOString(),
): DomainResult {
  if (!["OPTIONS_AVAILABLE", "OPTION_SELECTED", "IMPACT_SIMULATED"].includes(state.phase)) {
    return failure(
      state,
      "INVALID_STATE",
      "Options can only be selected before approval preparation.",
      false,
    )
  }

  const option = state.resolutionOptions.find((candidate) => candidate.id === optionId)

  if (!option) {
    return failure(
      state,
      "OPTION_NOT_FOUND",
      `Resolution option ${optionId} does not exist.`,
      false,
    )
  }

  if (state.selectedOptionId === optionId && state.phase === "OPTION_SELECTED") {
    return success(state, false)
  }

  return success(
    withActivity(
      {
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
      },
      state.selectedOptionId ? "selection_changed" : "option_selected",
      state.selectedOptionId ? "Selection changed" : "Option selected",
      `${optionId} selected by the human reviewer.`,
      now,
    ),
    true,
  )
}

export function simulateProjectImpact(
  state: DecisionRoomState,
  input: SimulateImpactInput,
  now = new Date().toISOString(),
): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)

  if (conflict) {
    return conflict
  }

  if (!["OPTION_SELECTED", "IMPACT_SIMULATED"].includes(state.phase)) {
    return failure(
      state,
      "INVALID_STATE",
      "Project impact can only be simulated after the human selects an option.",
      false,
    )
  }

  if (!state.selectedOptionId) {
    return failure(
      state,
      "OPTION_NOT_SELECTED",
      "A human-selected option is required before simulating project impact.",
      false,
    )
  }

  const option = state.resolutionOptions.find((candidate) => candidate.id === state.selectedOptionId)

  if (!option) {
    return failure(
      state,
      "OPTION_NOT_FOUND",
      "The selected option does not exist in the current decision state.",
      false,
    )
  }

  const mitigation: Mitigation | null = input.preserveInspectionMilestone
    ? {
        id: "MIT-001",
        type: "additional_mechanical_crew",
        label: "Add second MEP crew",
        additionalCost: 1200,
        daysRecovered: 1,
      }
    : null

  const fingerprint = [
    option.id,
    option.revision,
    option.fingerprint,
    input.preserveInspectionMilestone,
  ].join(":")
  const simulation = {
    id: "SIM-019" as const,
    optionId: option.id,
    optionRevision: option.revision,
    preserveInspectionMilestone: input.preserveInspectionMilestone,
    baseChangeCost: option.costImpact,
    baseScheduleImpactDays: option.scheduleImpactDays,
    mitigation,
    totalCostImpact: option.costImpact + (mitigation?.additionalCost ?? 0),
    finalScheduleImpactDays: Math.max(
      0,
      option.scheduleImpactDays - (mitigation?.daysRecovered ?? 0),
    ),
    projectedBudget:
      state.project.currentForecast + option.costImpact + (mitigation?.additionalCost ?? 0),
    fingerprint,
  }

  if (state.impactSimulation?.fingerprint === fingerprint) {
    return success(state, false)
  }

  return success(
    withActivity(
      {
        ...state,
        phase: "IMPACT_SIMULATED",
        stateVersion: state.stateVersion + 1,
        impactSimulation: simulation,
        decision: null,
        changeOrder: null,
        lastError: null,
      },
      "impact_simulated",
      "Impact simulated",
      `${formatSignedCurrency(simulation.totalCostImpact)} and ${formatScheduleImpact(simulation.finalScheduleImpactDays)} final schedule impact.`,
      now,
    ),
    true,
  )
}

export function prepareChangeDecision(
  state: DecisionRoomState,
  input: ExpectedVersionInput,
  now = new Date().toISOString(),
): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)

  if (conflict) {
    return conflict
  }

  if (!["IMPACT_SIMULATED", "READY_FOR_APPROVAL"].includes(state.phase)) {
    return failure(
      state,
      "INVALID_STATE",
      "A simulated impact is required before preparing the decision.",
      false,
    )
  }

  if (!state.impactSimulation) {
    return failure(
      state,
      "SIMULATION_REQUIRED",
      "Run project impact simulation before preparing the decision.",
      false,
    )
  }

  if (state.decision?.simulationFingerprint === state.impactSimulation.fingerprint) {
    return success(state, false)
  }

  return success(
    withActivity(
      {
        ...state,
        phase: "READY_FOR_APPROVAL",
        stateVersion: state.stateVersion + 1,
        decision: {
          id: "DEC-019",
          issueId: "ISS-019",
          optionId: state.impactSimulation.optionId,
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
      },
      "decision_prepared",
      "Decision prepared",
      "DEC-019 is ready for human approval.",
      now,
    ),
    true,
  )
}

export function approveDecisionByHuman(
  state: DecisionRoomState,
  now = new Date().toISOString(),
): DomainResult {
  if (state.phase !== "READY_FOR_APPROVAL" || !state.decision) {
    return failure(
      state,
      "INVALID_STATE",
      "Human approval is enabled only when DEC-019 is ready for approval.",
      false,
    )
  }

  if (state.decision.approvedAt) {
    return success(state, false)
  }

  return success(
    withActivity(
      {
        ...state,
        phase: "APPROVED",
        stateVersion: state.stateVersion + 1,
        decision: {
          ...state.decision,
          status: "APPROVED",
          approvedAt: now,
        },
        lastError: null,
      },
      "human_approved_decision",
      "Decision approved",
      "DEC-019 approved by the human project manager.",
      now,
    ),
    true,
  )
}

export function draftChangeOrder(
  state: DecisionRoomState,
  input: ExpectedVersionInput,
  now = new Date().toISOString(),
): DomainResult {
  const conflict = validateExpectedVersion(state, input.expectedStateVersion)

  if (conflict) {
    return conflict
  }

  if (!["APPROVED", "CHANGE_ORDER_DRAFTED"].includes(state.phase) || !state.decision?.approvedAt) {
    return failure(
      state,
      "HUMAN_APPROVAL_REQUIRED",
      "Human approval is required before drafting the change order.",
      false,
    )
  }

  const changeOrder = {
    id: "CO-007" as const,
    decisionId: "DEC-019" as const,
    reason:
      "Field coordination conflict between mechanical duct D22 and structural beam B14.",
    scope:
      "Reroute supply duct through Corridor C East and add additional MEP labor to preserve inspection milestone.",
    costImpact: state.decision.costImpact,
    scheduleImpactDays: state.decision.scheduleImpactDays,
    status: "draft" as const,
    sourceDecisionVersion: state.stateVersion,
  }

  if (state.changeOrder?.decisionId === changeOrder.decisionId) {
    return success(state, false)
  }

  return success(
    withActivity(
      {
        ...state,
        phase: "CHANGE_ORDER_DRAFTED",
        stateVersion: state.stateVersion + 1,
        changeOrder,
        lastError: null,
      },
      "change_order_drafted",
      "Change order drafted",
      "CO-007 draft created from approved DEC-019.",
      now,
    ),
    true,
  )
}

export function setPreviewOption(
  state: DecisionRoomState,
  optionId: OptionId | null,
): DecisionRoomState {
  if (state.previewOptionId === optionId) {
    return state
  }

  return {
    ...state,
    previewOptionId: optionId,
  }
}

export function resetDecisionRoom(
  createInitial: () => DecisionRoomState,
  now = new Date().toISOString(),
): DecisionRoomState {
  const initialState = createInitial()

  return withActivity(
    {
      ...initialState,
      stateVersion: initialState.stateVersion + 1,
    },
    "demo_reset",
    "Demo reset",
    "Returned to canonical ISS-019 investigation state.",
    now,
  )
}

export function getPreviewedOption(state: DecisionRoomState): ResolutionOption | null {
  const targetId = state.previewOptionId ?? state.selectedOptionId

  if (!targetId) {
    return null
  }

  return state.resolutionOptions.find((option) => option.id === targetId) ?? null
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatSignedCurrency(value: number): string {
  return value >= 0 ? `+${formatCurrency(value)}` : formatCurrency(value)
}

export function formatScheduleImpact(days: number): string {
  if (days === 0) {
    return "0 days"
  }

  return days > 0 ? `+${days} day${days === 1 ? "" : "s"}` : `${days} days`
}

function reviseOptionAgainstConstraint(
  option: ResolutionOption,
  constraint: Constraint,
): ResolutionOption {
  if (option.id !== "OPTION-A") {
    return option
  }

  const revisedOption: ResolutionOption = {
    ...option,
    revision: 2,
    routeOverlay: {
      id: "ROUTE-A-R2",
      drawingId: "M-204",
      label: "Corridor C East revised route",
      points: [
        { x: 124, y: 250 },
        { x: 458, y: 250 },
        { x: 458, y: 382 },
        { x: 686, y: 382 },
        { x: 686, y: 250 },
      ],
    },
    costImpact: 5300,
    scheduleImpactDays: 1,
    risk: "medium",
    constraintIds: ["CONSTRAINT-12"],
    status: "revised",
    fingerprint: `OPTION-A:r2:${constraintFingerprint(constraint)}`,
  }

  if (routeIntersectsRect(revisedOption.routeOverlay, constraint.geometry)) {
    return option
  }

  return revisedOption
}

function validateExpectedVersion(
  state: DecisionRoomState,
  expectedStateVersion: number,
): DomainFailure | null {
  if (state.stateVersion !== expectedStateVersion) {
    return failure(
      state,
      "STATE_CONFLICT",
      "The decision changed. Read the current context and retry.",
      true,
    )
  }

  return null
}

function sanitizeConstraintLabel(label: string): string {
  const trimmedLabel = label.trim().replace(/\s+/g, " ")

  if (!trimmedLabel) {
    return "Field constraint"
  }

  return trimmedLabel.slice(0, 60)
}

function constraintFingerprint(constraint: Constraint): string {
  const geometry = constraint.geometry

  return [
    constraint.label,
    geometry.x,
    geometry.y,
    geometry.width,
    geometry.height,
    constraint.drawingId,
    constraint.appliesTo.join(","),
  ].join(":")
}

function canMutateBeforeApproval(phase: DecisionPhase): boolean {
  return !["APPROVED", "CHANGE_ORDER_DRAFTED"].includes(phase)
}

function withActivity(
  state: DecisionRoomState,
  type: Parameters<typeof makeActivity>[1],
  label: string,
  detail: string,
  now: string,
): DecisionRoomState {
  return {
    ...state,
    activityLog: [
      makeActivity(state.activityLog.length + 1, type, label, detail, now),
      ...state.activityLog,
    ],
  }
}

function makeActivity(
  index: number,
  type: import("./types").ActivityEventType,
  label: string,
  detail: string,
  now: string,
) {
  return {
    id: `ACT-${String(index).padStart(3, "0")}`,
    type,
    label,
    detail,
    createdAt: now,
  }
}

function success(state: DecisionRoomState, changed: boolean): DomainSuccess {
  return {
    success: true,
    state,
    changed,
  }
}

function failure(
  state: DecisionRoomState,
  error: ToolErrorCode,
  message: string,
  retryable: boolean,
): DomainFailure {
  return {
    success: false,
    state: {
      ...state,
      lastError: error,
    },
    error,
    message,
    retryable,
  }
}
