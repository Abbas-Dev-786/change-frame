import { baseResolutionOptionsFixture } from "./fixtures"
import { clampRectToPlan, routeIntersectsRect } from "./geometry"
import type {
  Constraint,
  DecisionPhase,
  DecisionRoomState,
  DomainFailure,
  DomainResult,
  DomainSuccess,
  OptionId,
  Rect,
  ResolutionOption,
  ToolErrorCode,
} from "./types"

export type ConstraintDraft = {
  label: string
  geometry: Rect
}

type ExpectedVersionInput = {
  expectedStateVersion: number
}

type RevisionInput = ExpectedVersionInput & {
  optionId: OptionId
  expectedOptionRevision: number
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
