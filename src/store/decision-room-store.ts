import { create } from "zustand"

import {
  recordHumanDecisionAction,
  recordHumanWorkflowReset,
} from "@/src/observability/agent-flight-recorder"

import {
  createInitialDecisionState,
  approveDecisionByHuman,
  draftChangeOrder,
  evaluateResolutionOptions,
  prepareChangeDecision,
  rejectResolutionOption,
  resetDecisionRoom,
  reviseResolutionOption,
  selectResolutionOption,
  setPreviewOption,
  simulateProjectImpact,
  upsertHumanConstraint,
  type ConstraintDraft,
  type DecisionRoomState,
  type DomainResult,
  type ExpectedVersionInput,
  type OptionId,
  type OptionRejectionReason,
  type RevisionInput,
  type SimulateImpactInput,
} from "@/src/domain/decision"

const STORAGE_KEY = "changedecision-os:decision-room:v2"
const STORAGE_SCHEMA_VERSION = 2

type DecisionRoomActions = {
  evaluateOptions: () => void
  upsertConstraint: (draft: ConstraintDraft) => void
  reviseOption: (optionId: OptionId) => void
  rejectOption: (optionId: OptionId, reason: OptionRejectionReason) => void
  selectOption: (optionId: OptionId) => void
  simulateImpact: (preserveInspectionMilestone: boolean) => void
  prepareDecision: () => void
  approveDecision: () => void
  draftChangeOrder: () => void
  previewOption: (optionId: OptionId | null) => void
  resetWorkflow: () => void
}

export type DecisionRoomStore = DecisionRoomState & DecisionRoomActions

export const useDecisionRoomStore = create<DecisionRoomStore>((set, get) => ({
  ...loadSavedState(),
  evaluateOptions: () => {
    const currentState = readCurrentState(get())
    const result = evaluateResolutionOptions(currentState, {
      expectedStateVersion: currentState.stateVersion,
    })

    commitHumanResult(set, "evaluate_options", "Generated the supported resolution options.", currentState, result)
  },
  upsertConstraint: (draft) => {
    const currentState = readCurrentState(get())
    const result = upsertHumanConstraint(currentState, draft)

    commitHumanResult(set, "upsert_constraint", "Added the field constraint to the shared plan.", currentState, result)
  },
  reviseOption: (optionId) => {
    const currentState = readCurrentState(get())
    const option = currentState.resolutionOptions.find((candidate) => candidate.id === optionId)

    if (!option) {
      return
    }

    const result = reviseResolutionOption(currentState, {
      optionId,
      expectedOptionRevision: option.revision,
      expectedStateVersion: currentState.stateVersion,
    })

    commitHumanResult(set, "revise_option", `Revised ${optionId} from the human interface.`, currentState, result)
  },
  rejectOption: (optionId, reason) => {
    const currentState = readCurrentState(get())
    const result = rejectResolutionOption(currentState, {
      optionId,
      reason,
    })

    commitHumanResult(set, "reject_option", `Rejected ${optionId}.`, currentState, result)
  },
  selectOption: (optionId) => {
    const currentState = readCurrentState(get())
    const result = selectResolutionOption(currentState, optionId)

    commitHumanResult(set, "select_option", `Selected ${optionId} as the human reviewer.`, currentState, result)
  },
  simulateImpact: (preserveInspectionMilestone) => {
    const currentState = readCurrentState(get())
    const result = simulateProjectImpact(currentState, {
      preserveInspectionMilestone,
      expectedStateVersion: currentState.stateVersion,
    })

    commitHumanResult(set, "simulate_impact", "Ran project impact simulation from the human interface.", currentState, result)
  },
  prepareDecision: () => {
    const currentState = readCurrentState(get())
    const result = prepareChangeDecision(currentState, {
      expectedStateVersion: currentState.stateVersion,
    })

    commitHumanResult(set, "prepare_decision", "Prepared the decision from the human interface.", currentState, result)
  },
  approveDecision: () => {
    const currentState = readCurrentState(get())
    const result = approveDecisionByHuman(currentState)

    commitHumanResult(set, "approve_decision", "Approved DEC-019 at the protected human checkpoint.", currentState, result)
  },
  draftChangeOrder: () => {
    const currentState = readCurrentState(get())
    const result = draftChangeOrder(currentState, {
      expectedStateVersion: currentState.stateVersion,
    })

    commitHumanResult(set, "draft_change_order", "Drafted CO-007 from the human interface.", currentState, result)
  },
  previewOption: (optionId) => {
    const nextState = setPreviewOption(readCurrentState(get()), optionId)
    set({ previewOptionId: nextState.previewOptionId })
  },
  resetWorkflow: () => {
    const currentState = readCurrentState(get())
    clearSavedState()
    const nextState = resetDecisionRoom(
      currentState,
      () => createInitialDecisionState(new Date().toISOString()),
    )
    commitDecisionRoomState(set, nextState)
    recordHumanWorkflowReset(currentState.stateVersion, nextState.stateVersion)
  },
}))

function readCurrentState(store: DecisionRoomStore): DecisionRoomState {
  return {
    phase: store.phase,
    stateVersion: store.stateVersion,
    project: store.project,
    activeIssue: store.activeIssue,
    drawings: store.drawings,
    drawingElements: store.drawingElements,
    schedule: store.schedule,
    contracts: store.contracts,
    activeDrawingId: store.activeDrawingId,
    constraints: store.constraints,
    resolutionOptions: store.resolutionOptions,
    selectedOptionId: store.selectedOptionId,
    previewOptionId: store.previewOptionId,
    impactSimulation: store.impactSimulation,
    decision: store.decision,
    changeOrder: store.changeOrder,
    activityLog: store.activityLog,
    lastError: store.lastError,
  }
}

export function getDecisionRoomState(): DecisionRoomState {
  return readCurrentState(useDecisionRoomStore.getState())
}

export function runDecisionToolAction(
  action:
    | { type: "evaluate_options"; input: ExpectedVersionInput }
    | { type: "revise_option"; input: RevisionInput }
    | { type: "simulate_impact"; input: SimulateImpactInput }
    | { type: "prepare_decision"; input: ExpectedVersionInput }
    | { type: "draft_change_order"; input: ExpectedVersionInput },
): DomainResult {
  const state = getDecisionRoomState()
  const result = executeToolAction(state, action)

  if (result.success) {
    commitDecisionRoomState(useDecisionRoomStore.setState, result.state)
  }

  return result
}

function executeToolAction(
  state: DecisionRoomState,
  action:
    | { type: "evaluate_options"; input: ExpectedVersionInput }
    | { type: "revise_option"; input: RevisionInput }
    | { type: "simulate_impact"; input: SimulateImpactInput }
    | { type: "prepare_decision"; input: ExpectedVersionInput }
    | { type: "draft_change_order"; input: ExpectedVersionInput },
): DomainResult {
  switch (action.type) {
    case "evaluate_options":
      return evaluateResolutionOptions(state, action.input)
    case "revise_option":
      return reviseResolutionOption(state, action.input)
    case "simulate_impact":
      return simulateProjectImpact(state, action.input)
    case "prepare_decision":
      return prepareChangeDecision(state, action.input)
    case "draft_change_order":
      return draftChangeOrder(state, action.input)
  }
}

function commitDecisionRoomState(
  set: (state: Partial<DecisionRoomStore>) => void,
  state: DecisionRoomState,
): void {
  writeSavedState(state)
  set(state)
}

function commitHumanResult(
  set: (state: Partial<DecisionRoomStore>) => void,
  action: string,
  label: string,
  currentState: DecisionRoomState,
  result: DomainResult,
): void {
  commitDecisionRoomState(set, result.state)
  recordHumanDecisionAction(action, label, currentState.stateVersion, result)
}

function loadSavedState(): DecisionRoomState {
  if (typeof window === "undefined") {
    return createInitialDecisionState()
  }

  try {
    const savedValue = window.sessionStorage.getItem(STORAGE_KEY)

    if (!savedValue) {
      return createInitialDecisionState()
    }

    const parsedValue: unknown = JSON.parse(savedValue)

    if (
      isRecord(parsedValue) &&
      parsedValue.schemaVersion === STORAGE_SCHEMA_VERSION &&
      isDecisionRoomState(parsedValue.state)
    ) {
      return normalizeSavedState(parsedValue.state)
    }
  } catch {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage can be disabled; the in-memory workflow remains usable.
    }
  }

  return createInitialDecisionState()
}

function normalizeSavedState(state: DecisionRoomState): DecisionRoomState {
  return {
    ...state,
    resolutionOptions: state.resolutionOptions.map((option) => ({
      ...option,
      rejectionReason: option.rejectionReason ?? null,
    })),
  }
}

function writeSavedState(state: DecisionRoomState): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION, state }),
    )
  } catch {
    // Storage failure must not prevent an otherwise valid local state transition.
  }
}

function clearSavedState(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted contexts.
  }
}

function isDecisionRoomState(value: unknown): value is DecisionRoomState {
  if (!isRecord(value)) {
    return false
  }

  return (
    isDecisionPhase(value.phase) &&
    Number.isInteger(value.stateVersion) &&
    typeof value.stateVersion === "number" &&
    value.stateVersion >= 1 &&
    isRecord(value.project) && value.project.id === "PROJECT-01" &&
    isRecord(value.activeIssue) && value.activeIssue.id === "ISS-019" &&
    Array.isArray(value.drawings) &&
    Array.isArray(value.drawingElements) &&
    Array.isArray(value.schedule) &&
    Array.isArray(value.contracts) &&
    value.activeDrawingId === "M-204" &&
    Array.isArray(value.constraints) && value.constraints.every(isConstraint) &&
    Array.isArray(value.resolutionOptions) && value.resolutionOptions.every(isResolutionOption) &&
    (value.selectedOptionId === null || isOptionId(value.selectedOptionId)) &&
    (value.previewOptionId === null || isOptionId(value.previewOptionId)) &&
    (value.impactSimulation === null || isRecord(value.impactSimulation)) &&
    (value.decision === null || isDecision(value.decision)) &&
    (value.changeOrder === null || isRecord(value.changeOrder)) &&
    Array.isArray(value.activityLog) && value.activityLog.every(isActivityEvent) &&
    (value.lastError === null || isToolErrorCode(value.lastError))
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDecisionPhase(value: unknown): boolean {
  return [
    "INVESTIGATING",
    "OPTIONS_AVAILABLE",
    "OPTION_SELECTED",
    "IMPACT_SIMULATED",
    "READY_FOR_APPROVAL",
    "APPROVED",
    "CHANGE_ORDER_DRAFTED",
  ].includes(String(value))
}

function isOptionId(value: unknown): value is OptionId {
  return value === "OPTION-A" || value === "OPTION-B" || value === "OPTION-C"
}

function isConstraint(value: unknown): boolean {
  if (!isRecord(value) || value.id !== "CONSTRAINT-12" || !isRecord(value.geometry)) {
    return false
  }

  const geometry = value.geometry

  return ["x", "y", "width", "height"].every(
    (key) => typeof geometry[key] === "number" && Number.isFinite(geometry[key]),
  )
}

function isResolutionOption(value: unknown): boolean {
  return (
    isRecord(value) &&
    isOptionId(value.id) &&
    ["reroute", "resize", "split"].includes(String(value.strategy)) &&
    typeof value.revision === "number" && Number.isInteger(value.revision) && value.revision >= 1 &&
    ["available", "needs_revision", "revised", "rejected", "selected"].includes(String(value.status)) &&
    typeof value.fingerprint === "string"
  )
}

function isDecision(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.id === "DEC-019" &&
    isOptionId(value.optionId) &&
    typeof value.optionRevision === "number" &&
    Number.isInteger(value.optionRevision) &&
    value.optionRevision >= 1
  )
}

function isActivityEvent(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    typeof value.label === "string" &&
    typeof value.detail === "string" &&
    typeof value.createdAt === "string"
  )
}

function isToolErrorCode(value: unknown): boolean {
  return [
    "INVALID_STATE",
    "OPTION_NOT_FOUND",
    "CONSTRAINT_NOT_FOUND",
    "OPTION_NOT_SELECTED",
    "SIMULATION_REQUIRED",
    "HUMAN_APPROVAL_REQUIRED",
    "STATE_CONFLICT",
    "OPTION_REVISION_CONFLICT",
    "INVALID_CONSTRAINT_GEOMETRY",
    "UNSUPPORTED_CONSTRAINT_GEOMETRY",
  ].includes(String(value))
}
