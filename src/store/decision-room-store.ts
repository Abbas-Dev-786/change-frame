import { create } from "zustand"

import {
  createInitialDecisionState,
  evaluateResolutionOptions,
  resetDecisionRoom,
  reviseResolutionOption,
  selectResolutionOption,
  setPreviewOption,
  upsertHumanConstraint,
  type ConstraintDraft,
  type DecisionRoomState,
  type OptionId,
} from "@/src/domain/decision"

const STORAGE_KEY = "changedecision-os:decision-room:v1"

type DecisionRoomActions = {
  evaluateOptions: () => void
  upsertConstraint: (draft: ConstraintDraft) => void
  reviseOption: (optionId: OptionId) => void
  selectOption: (optionId: OptionId) => void
  previewOption: (optionId: OptionId | null) => void
  resetDemo: () => void
}

export type DecisionRoomStore = DecisionRoomState & DecisionRoomActions

export const useDecisionRoomStore = create<DecisionRoomStore>((set, get) => ({
  ...loadSavedState(),
  evaluateOptions: () => {
    const currentState = readCurrentState(get())
    const result = evaluateResolutionOptions(currentState, {
      expectedStateVersion: currentState.stateVersion,
    })

    commitState(set, result.state)
  },
  upsertConstraint: (draft) => {
    const result = upsertHumanConstraint(readCurrentState(get()), draft)

    commitState(set, result.state)
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

    commitState(set, result.state)
  },
  selectOption: (optionId) => {
    const result = selectResolutionOption(readCurrentState(get()), optionId)

    commitState(set, result.state)
  },
  previewOption: (optionId) => {
    const nextState = setPreviewOption(readCurrentState(get()), optionId)

    commitState(set, nextState)
  },
  resetDemo: () => {
    clearSavedState()
    commitState(
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
    activityLog: store.activityLog,
    lastError: store.lastError,
  }
}

function commitState(
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
    Array.isArray(value.activityLog)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
