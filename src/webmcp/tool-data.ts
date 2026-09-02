import type { DecisionRoomState, OptionId, ResolutionOption } from "@/src/domain/decision"

export function decisionContextData(state: DecisionRoomState): Record<string, unknown> {
  return {
    project: {
      id: state.project.id,
      name: state.project.name,
      budget: state.project.budget,
    },
    issue: {
      id: state.activeIssue.id,
      title: state.activeIssue.title,
      severity: state.activeIssue.severity,
      drawingId: state.activeIssue.drawingId,
      location: state.activeIssue.location,
    },
    baselineConstraints: [
      {
        id: "BASE-01",
        type: "fixed_element",
        label: "Beam B14 cannot move",
      },
    ],
    phase: state.phase,
    stateVersion: state.stateVersion,
    selectedOptionId: state.selectedOptionId,
    availableTools: availableToolNames(state),
  }
}

export function userConstraintsData(state: DecisionRoomState): Record<string, unknown> {
  return {
    constraints: state.constraints,
  }
}

export function optionsData(state: DecisionRoomState): Record<string, unknown> {
  return {
    options: state.resolutionOptions.map(optionSummary),
  }
}

export function revisedOptionData(state: DecisionRoomState, optionId: OptionId): Record<string, unknown> {
  const option = state.resolutionOptions.find((candidate) => candidate.id === optionId)

  return {
    option: option ? optionSummary(option) : null,
  }
}

export function simulationData(state: DecisionRoomState): Record<string, unknown> {
  const simulation = state.impactSimulation

  if (!simulation) {
    return {}
  }

  return {
    id: simulation.id,
    optionId: simulation.optionId,
    optionRevision: simulation.optionRevision,
    preserveInspectionMilestone: simulation.preserveInspectionMilestone,
    baseChangeCost: simulation.baseChangeCost,
    baseScheduleImpactDays: simulation.baseScheduleImpactDays,
    mitigation: simulation.mitigation,
    totalCostImpact: simulation.totalCostImpact,
    finalScheduleImpactDays: simulation.finalScheduleImpactDays,
    projectedBudget: simulation.projectedBudget,
  }
}

export function decisionData(state: DecisionRoomState): Record<string, unknown> {
  const decision = state.decision

  return {
    decision: decision
      ? {
          id: decision.id,
          issueId: decision.issueId,
          optionId: decision.optionId,
          optionRevision: decision.optionRevision,
          mitigationId: decision.mitigationId,
          costImpact: decision.costImpact,
          scheduleImpactDays: decision.scheduleImpactDays,
          status: decision.status,
          approvedAt: decision.approvedAt,
          sourceStateVersion: decision.sourceStateVersion,
        }
      : null,
  }
}

export function changeOrderData(state: DecisionRoomState): Record<string, unknown> {
  return {
    changeOrder: state.changeOrder,
    phase: state.phase,
  }
}

export function availableToolNames(state: DecisionRoomState): string[] {
  const tools = ["get_decision_context", "get_user_constraints"]

  if (state.phase === "INVESTIGATING") {
    tools.push("evaluate_resolution_options")
  }

  if (state.phase === "OPTIONS_AVAILABLE" && state.constraints.length > 0 && canReviseConstrainedOption(state)) {
    tools.push("revise_resolution_option")
  }

  if (state.phase === "OPTION_SELECTED") {
    tools.push("simulate_project_impact")
  }

  if (state.phase === "IMPACT_SIMULATED") {
    tools.push("prepare_change_decision")
  }

  if (state.phase === "APPROVED") {
    tools.push("draft_change_order")
  }

  return tools
}

function canReviseConstrainedOption(state: DecisionRoomState): boolean {
  return state.resolutionOptions.some(
    (option) => option.id === "OPTION-A" && option.status !== "rejected",
  )
}

function optionSummary(option: ResolutionOption) {
  return {
    id: option.id,
    title: option.title,
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
