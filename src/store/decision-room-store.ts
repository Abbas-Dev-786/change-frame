import { create } from "zustand"
import { recordHumanDecisionAction, recordHumanWorkflowReset } from "@/src/observability/agent-flight-recorder"
import {
  approveDecisionByHuman,
  configureDecisionContext,
  createInitialDecisionState,
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
  type AgentMitigationProposal,
  type ConstraintDraft,
  type DecisionContextInput,
  type DecisionRoomState,
  type DomainResult,
  type EvaluateOptionsInput,
  type ExpectedVersionInput,
  type OptionId,
  type OptionRejectionReason,
  type RevisionInput,
  type SimulateImpactInput,
} from "@/src/domain/decision"

const STORAGE_KEY = "changeframe:decision-room:v4"
const STORAGE_SCHEMA_VERSION = 4

type DecisionRoomActions = {
  configureContext: (input: Omit<DecisionContextInput, "expectedStateVersion">) => void
  upsertConstraint: (draft: ConstraintDraft) => void
  rejectOption: (optionId: OptionId, reason: OptionRejectionReason) => void
  selectOption: (optionId: OptionId) => void
  simulateImpact: (mitigation?: AgentMitigationProposal | null) => void
  prepareDecision: () => void
  approveDecision: () => void
  draftChangeOrder: () => void
  previewOption: (optionId: OptionId | null) => void
  resetWorkflow: () => void
}

export type DecisionRoomStore = DecisionRoomState & DecisionRoomActions

export const useDecisionRoomStore = create<DecisionRoomStore>((set, get) => ({
  ...loadSavedState(),
  configureContext: (input) => {
    const current = readCurrentState(get())
    commitHumanResult(set, "configure_context", "Configured the live project context.", current, configureDecisionContext(current, { ...input, expectedStateVersion: current.stateVersion }))
  },
  upsertConstraint: (draft) => {
    const current = readCurrentState(get())
    commitHumanResult(set, "upsert_constraint", "Added the field constraint to the shared plan.", current, upsertHumanConstraint(current, draft))
  },
  rejectOption: (optionId, reason) => {
    const current = readCurrentState(get())
    commitHumanResult(set, "reject_option", `Rejected ${optionId}.`, current, rejectResolutionOption(current, { optionId, reason }))
  },
  selectOption: (optionId) => {
    const current = readCurrentState(get())
    commitHumanResult(set, "select_option", `Selected ${optionId} as the human reviewer.`, current, selectResolutionOption(current, optionId))
  },
  simulateImpact: (mitigation = null) => {
    const current = readCurrentState(get())
    commitHumanResult(set, "simulate_impact", "Calculated impact from the selected agent proposal.", current, simulateProjectImpact(current, { mitigation, expectedStateVersion: current.stateVersion }))
  },
  prepareDecision: () => {
    const current = readCurrentState(get())
    commitHumanResult(set, "prepare_decision", "Prepared the decision for review.", current, prepareChangeDecision(current, { expectedStateVersion: current.stateVersion }))
  },
  approveDecision: () => {
    const current = readCurrentState(get())
    commitHumanResult(set, "approve_decision", `Approved ${current.decision?.id ?? "the decision"} at the protected human checkpoint.`, current, approveDecisionByHuman(current))
  },
  draftChangeOrder: () => {
    const current = readCurrentState(get())
    commitHumanResult(set, "draft_change_order", "Drafted a change order from the approved decision.", current, draftChangeOrder(current, { expectedStateVersion: current.stateVersion }))
  },
  previewOption: (optionId) => set({ previewOptionId: setPreviewOption(readCurrentState(get()), optionId).previewOptionId }),
  resetWorkflow: () => {
    const current = readCurrentState(get())
    clearSavedState()
    const next = resetDecisionRoom(current, () => createInitialDecisionState(new Date().toISOString()))
    commitDecisionRoomState(set, next)
    recordHumanWorkflowReset(current.stateVersion, next.stateVersion)
  },
}))

export function getDecisionRoomState(): DecisionRoomState { return readCurrentState(useDecisionRoomStore.getState()) }

export function runDecisionToolAction(action:
  | { type: "configure_context"; input: DecisionContextInput }
  | { type: "evaluate_options"; input: EvaluateOptionsInput }
  | { type: "revise_option"; input: RevisionInput }
  | { type: "simulate_impact"; input: SimulateImpactInput }
  | { type: "prepare_decision"; input: ExpectedVersionInput }
  | { type: "draft_change_order"; input: ExpectedVersionInput }
): DomainResult {
  const state = getDecisionRoomState()
  const result = executeToolAction(state, action)
  if (result.success) commitDecisionRoomState(useDecisionRoomStore.setState, result.state)
  return result
}

function executeToolAction(state: DecisionRoomState, action:
  | { type: "configure_context"; input: DecisionContextInput }
  | { type: "evaluate_options"; input: EvaluateOptionsInput }
  | { type: "revise_option"; input: RevisionInput }
  | { type: "simulate_impact"; input: SimulateImpactInput }
  | { type: "prepare_decision"; input: ExpectedVersionInput }
  | { type: "draft_change_order"; input: ExpectedVersionInput }
): DomainResult {
  switch (action.type) {
    case "configure_context": return configureDecisionContext(state, action.input)
    case "evaluate_options": return evaluateResolutionOptions(state, action.input)
    case "revise_option": return reviseResolutionOption(state, action.input)
    case "simulate_impact": return simulateProjectImpact(state, action.input)
    case "prepare_decision": return prepareChangeDecision(state, action.input)
    case "draft_change_order": return draftChangeOrder(state, action.input)
  }
}

function readCurrentState(store: DecisionRoomStore): DecisionRoomState {
  return {
    phase: store.phase,
    stateVersion: store.stateVersion,
    contextConfigured: store.contextConfigured,
    contextSource: store.contextSource,
    project: store.project,
    activeIssue: store.activeIssue,
    drawings: store.drawings,
    drawingElements: store.drawingElements,
    schedule: store.schedule,
    contracts: store.contracts,
    baselineConstraints: store.baselineConstraints,
    planViewBox: store.planViewBox,
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

function commitDecisionRoomState(set: (state: Partial<DecisionRoomStore>) => void, state: DecisionRoomState): void {
  writeSavedState(state); set(state)
}

function commitHumanResult(set: (state: Partial<DecisionRoomStore>) => void, action: string, label: string, current: DecisionRoomState, result: DomainResult): void {
  commitDecisionRoomState(set, result.state); recordHumanDecisionAction(action, label, current.stateVersion, result)
}

function loadSavedState(): DecisionRoomState {
  if (typeof window === "undefined") return createInitialDecisionState()
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return createInitialDecisionState()
    const parsed: unknown = JSON.parse(saved)
    if (isRecord(parsed) && parsed.schemaVersion === STORAGE_SCHEMA_VERSION && isDecisionRoomState(parsed.state)) return parsed.state
  } catch {
    try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* in-memory mode remains available */ }
  }
  return createInitialDecisionState()
}

function writeSavedState(state: DecisionRoomState): void {
  if (typeof window === "undefined") return
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION, state })) } catch { /* in-memory mode remains available */ }
}

function clearSavedState(): void {
  if (typeof window === "undefined") return
  try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* storage can be unavailable */ }
}

function isDecisionRoomState(value: unknown): value is DecisionRoomState {
  if (!isRecord(value)) return false
  return isDecisionPhase(value.phase) && Number.isInteger(value.stateVersion) &&
    typeof value.contextConfigured === "boolean" && ["starter", "human", "agent"].includes(String(value.contextSource)) &&
    isProject(value.project) && isIssue(value.activeIssue) && isRecordList(value.drawings) &&
    isRecordList(value.drawingElements) && isRecordList(value.schedule) && isRecordList(value.contracts) &&
    isRecordList(value.baselineConstraints) && isViewBox(value.planViewBox) && typeof value.activeDrawingId === "string" &&
    Array.isArray(value.constraints) && value.constraints.every(isConstraint) &&
    Array.isArray(value.resolutionOptions) && value.resolutionOptions.every(isResolutionOption) &&
    (value.selectedOptionId === null || typeof value.selectedOptionId === "string") &&
    (value.previewOptionId === null || typeof value.previewOptionId === "string") &&
    (value.impactSimulation === null || isRecord(value.impactSimulation)) &&
    (value.decision === null || isRecord(value.decision)) && (value.changeOrder === null || isRecord(value.changeOrder)) &&
    Array.isArray(value.activityLog) && value.activityLog.every((event) => isRecord(event) && typeof event.id === "string" && typeof event.label === "string" && typeof event.detail === "string")
}

function isDecisionPhase(value: unknown): boolean {
  return ["INVESTIGATING", "OPTIONS_AVAILABLE", "OPTION_SELECTED", "IMPACT_SIMULATED", "READY_FOR_APPROVAL", "APPROVED", "CHANGE_ORDER_DRAFTED"].includes(String(value))
}

function isProject(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && isFiniteNumber(value.budget) && isFiniteNumber(value.currentForecast) && typeof value.currency === "string"
}

function isIssue(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string" && typeof value.description === "string" && typeof value.drawingId === "string" && Array.isArray(value.elementIds) && Array.isArray(value.affectedActivityIds) && Array.isArray(value.affectedContractIds)
}

function isViewBox(value: unknown): boolean {
  return isRecord(value) && isFiniteNumber(value.width) && value.width >= 100 && isFiniteNumber(value.height) && value.height >= 100
}

function isConstraint(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" && typeof value.label === "string" && isRect(value.geometry)
}

function isResolutionOption(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string" && typeof value.description === "string" && typeof value.strategy === "string" && typeof value.rationale === "string" && Array.isArray(value.assumptions) && value.assumptions.every((item) => typeof item === "string") && isFiniteNumber(value.confidence) && isFiniteNumber(value.costImpact) && isFiniteNumber(value.scheduleImpactDays) && (value.routeOverlay === null || (isRecord(value.routeOverlay) && Array.isArray(value.routeOverlay.points)))
}

function isRect(value: unknown): boolean {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y) && isFiniteNumber(value.width) && isFiniteNumber(value.height)
}

function isRecordList(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord)
}

function isFiniteNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value) }
