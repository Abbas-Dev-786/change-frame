import { create } from "zustand"

import {
  createInitialDecisionState,
  approveDecisionByHuman,
  draftChangeOrder,
  evaluateResolutionOptions,
  prepareChangeDecision,
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
  type RevisionInput,
  type SimulateImpactInput,
} from "@/src/domain/decision"

const STORAGE_KEY = "changedecision-os:decision-room:v1"

type DecisionRoomActions = {
  evaluateOptions: () => void
  upsertConstraint: (draft: ConstraintDraft) => void
  reviseOption: (optionId: OptionId) => void
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

    commitDecisionRoomState(set, result.state)
  },
  upsertConstraint: (draft) => {
    const result = upsertHumanConstraint(readCurrentState(get()), draft)

    commitDecisionRoomState(set, result.state)
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

    commitDecisionRoomState(set, result.state)
  },
  selectOption: (optionId) => {
    const result = selectResolutionOption(readCurrentState(get()), optionId)

    commitDecisionRoomState(set, result.state)
  },
  simulateImpact: (preserveInspectionMilestone) => {
    const currentState = readCurrentState(get())
    const result = simulateProjectImpact(currentState, {
      preserveInspectionMilestone,
      expectedStateVersion: currentState.stateVersion,
    })

    commitDecisionRoomState(set, result.state)
  },
  prepareDecision: () => {
    const currentState = readCurrentState(get())
    const result = prepareChangeDecision(currentState, {
      expectedStateVersion: currentState.stateVersion,
    })

    commitDecisionRoomState(set, result.state)
  },
  approveDecision: () => {
    const result = approveDecisionByHuman(readCurrentState(get()))

    commitDecisionRoomState(set, result.state)
  },
  draftChangeOrder: () => {
    const currentState = readCurrentState(get())
    const result = draftChangeOrder(currentState, {
      expectedStateVersion: currentState.stateVersion,
    })

    commitDecisionRoomState(set, result.state)
  },
  previewOption: (optionId) => {
    const nextState = setPreviewOption(readCurrentState(get()), optionId)

    commitDecisionRoomState(set, nextState)
  },
  resetWorkflow: () => {
    clearSavedState()
    commitDecisionRoomState(
      set,
      resetDecisionRoom(() => createInitialDecisionState(new Date().toISOString())),
    )
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

function loadSavedState(): DecisionRoomState {
  if (typeof window === "undefined") {
    return createInitialDecisionState()
  }

  const savedValue = window.sessionStorage.getItem(STORAGE_KEY)

  if (!savedValue) {
    return createInitialDecisionState()
  }

  try {
    const parsedValue: unknown = JSON.parse(savedValue)

    if (isDecisionRoomState(parsedValue)) {
      return parsedValue
    }
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY)
  }

  return createInitialDecisionState()
}

function writeSavedState(state: DecisionRoomState): void {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clearSavedState(): void {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.removeItem(STORAGE_KEY)
}

function isDecisionRoomState(value: unknown): value is DecisionRoomState {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.phase === "string" &&
    typeof value.stateVersion === "number" &&
    isRecord(value.project) &&
    isRecord(value.activeIssue) &&
    Array.isArray(value.drawings) &&
    Array.isArray(value.drawingElements) &&
    Array.isArray(value.schedule) &&
    Array.isArray(value.contracts) &&
    value.activeDrawingId === "M-204" &&
    Array.isArray(value.constraints) &&
    Array.isArray(value.resolutionOptions) &&
    "impactSimulation" in value &&
    "decision" in value &&
    "changeOrder" in value &&
    Array.isArray(value.activityLog)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
