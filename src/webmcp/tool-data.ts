import type { DecisionRoomState, OptionId, ResolutionOption } from "@/src/domain/decision"

export function decisionContextData(state: DecisionRoomState): Record<string, unknown> {
  return {
    contextConfigured: state.contextConfigured,
    contextSource: state.contextSource,
    project: state.project,
    issue: state.activeIssue,
    drawings: state.drawings,
    drawingElements: state.drawingElements,
    schedule: state.schedule,
    contracts: state.contracts,
    baselineConstraints: state.baselineConstraints,
    planViewBox: state.planViewBox,
    activeDrawingId: state.activeDrawingId,
    resolutionOptions: state.resolutionOptions.map(optionSummary),
    phase: state.phase,
    stateVersion: state.stateVersion,
    selectedOptionId: state.selectedOptionId,
    availableTools: availableToolNames(state),
  }
}

export function userConstraintsData(state: DecisionRoomState): Record<string, unknown> {
  return { constraints: state.constraints }
}

export function optionsData(state: DecisionRoomState): Record<string, unknown> {
  return { options: state.resolutionOptions.map(optionSummary) }
}

export function revisedOptionData(state: DecisionRoomState, optionId: OptionId): Record<string, unknown> {
  const option = state.resolutionOptions.find((candidate) => candidate.id === optionId)
  return { option: option ? optionSummary(option) : null }
}

export function simulationData(state: DecisionRoomState): Record<string, unknown> {
  return state.impactSimulation ? { simulation: state.impactSimulation } : {}
}

export function decisionData(state: DecisionRoomState): Record<string, unknown> {
  return { decision: state.decision }
}

export function changeOrderData(state: DecisionRoomState): Record<string, unknown> {
  return { changeOrder: state.changeOrder, phase: state.phase }
}

export function availableToolNames(state: DecisionRoomState): string[] {
  const tools = ["get_decision_context", "get_user_constraints"]
  if (state.phase === "INVESTIGATING" && state.resolutionOptions.length === 0) tools.push("configure_decision_context")
  if (state.contextConfigured && state.phase === "INVESTIGATING") tools.push("evaluate_resolution_options")
  if (state.phase === "OPTIONS_AVAILABLE" && state.constraints.length > 0 && state.resolutionOptions.some((option) => option.status === "needs_revision")) tools.push("revise_resolution_option")
  if (state.phase === "OPTION_SELECTED") tools.push("simulate_project_impact")
  if (state.phase === "IMPACT_SIMULATED") tools.push("prepare_change_decision")
  if (state.phase === "APPROVED") tools.push("draft_change_order")
  return tools
}

function optionSummary(option: ResolutionOption) {
  return {
    id: option.id,
    title: option.title,
    description: option.description,
    strategy: option.strategy,
    rationale: option.rationale,
    assumptions: option.assumptions,
    confidence: option.confidence,
    authoredBy: option.authoredBy,
    revision: option.revision,
    costImpact: option.costImpact,
    scheduleImpactDays: option.scheduleImpactDays,
    risk: option.risk,
    constraintIds: option.constraintIds,
    status: option.status,
    rejectionReason: option.rejectionReason,
    routeOverlay: option.routeOverlay,
  }
}
