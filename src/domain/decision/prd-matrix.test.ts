import { describe, expect, it } from "vitest"

import {
  DEFAULT_CONSTRAINT_RECT,
  approveDecisionByHuman,
  createInitialDecisionState,
  draftChangeOrder,
  evaluateResolutionOptions,
  prepareChangeDecision,
  rejectResolutionOption,
  reviseResolutionOption,
  selectResolutionOption,
  simulateProjectImpact,
  upsertHumanConstraint,
  type DecisionRoomState,
  type DomainResult,
} from "./index"

describe("PRD transition and rollback matrix", () => {
  it.each([
    "OPTION_SELECTED",
    "IMPACT_SIMULATED",
    "READY_FOR_APPROVAL",
  ] as const)("rolls %s back when a constraint is replaced defensively", (phase) => {
    const states = buildHeroStates()
    const source = states[phase]
    const result = requireSuccess(
      upsertHumanConstraint(source, {
        label: "Replacement riser",
        geometry: { x: 500, y: 160, width: 90, height: 120 },
      }),
    )

    expect(result.phase).toBe("OPTIONS_AVAILABLE")
    expect(result.selectedOptionId).toBeNull()
    expect(result.impactSimulation).toBeNull()
    expect(result.decision).toBeNull()
    expect(result.changeOrder).toBeNull()
    expect(result.resolutionOptions.find((option) => option.id === "OPTION-A")?.status).toBe("needs_revision")
  })

  it.each([
    "OPTIONS_AVAILABLE",
    "OPTION_SELECTED",
    "IMPACT_SIMULATED",
    "READY_FOR_APPROVAL",
  ] as const)("rolls %s to options when a constrained option is revised", (phase) => {
    const states = buildHeroStates()
    const constrained = states.CONSTRAINED
    const source: DecisionRoomState = {
      ...states[phase],
      phase,
      constraints: constrained.constraints,
      resolutionOptions: constrained.resolutionOptions,
    }
    const result = requireSuccess(
      reviseResolutionOption(source, {
        optionId: "OPTION-A",
        expectedOptionRevision: 1,
        expectedStateVersion: source.stateVersion,
      }),
    )

    expect(result.phase).toBe("OPTIONS_AVAILABLE")
    expect(result.selectedOptionId).toBeNull()
    expect(result.impactSimulation).toBeNull()
    expect(result.decision).toBeNull()
    expect(result.changeOrder).toBeNull()
  })

  it.each(["OPTION_SELECTED", "IMPACT_SIMULATED"] as const)(
    "clears derived state when selection changes from %s",
    (phase) => {
      const states = buildHeroStates()
      const source = states[phase]
      const result = requireSuccess(selectResolutionOption(source, "OPTION-C"))

      expect(result.phase).toBe("OPTION_SELECTED")
      expect(result.selectedOptionId).toBe("OPTION-C")
      expect(result.impactSimulation).toBeNull()
      expect(result.decision).toBeNull()
      expect(result.changeOrder).toBeNull()
    },
  )

  it("rejects every mutation family in a representative wrong phase", () => {
    const states = buildHeroStates()
    const checks: DomainResult[] = [
      evaluateResolutionOptions(states.OPTION_SELECTED, {
        expectedStateVersion: states.OPTION_SELECTED.stateVersion,
      }),
      upsertHumanConstraint(states.APPROVED, {
        label: "Too late",
        geometry: DEFAULT_CONSTRAINT_RECT,
      }),
      reviseResolutionOption(states.APPROVED, {
        optionId: "OPTION-A",
        expectedOptionRevision: 2,
        expectedStateVersion: states.APPROVED.stateVersion,
      }),
      selectResolutionOption(states.READY_FOR_APPROVAL, "OPTION-C"),
      rejectResolutionOption(states.READY_FOR_APPROVAL, {
        optionId: "OPTION-C",
        reason: "too_expensive",
      }),
      simulateProjectImpact(states.OPTIONS_AVAILABLE, {
        preserveInspectionMilestone: true,
        expectedStateVersion: states.OPTIONS_AVAILABLE.stateVersion,
      }),
      prepareChangeDecision(states.OPTION_SELECTED, {
        expectedStateVersion: states.OPTION_SELECTED.stateVersion,
      }),
      approveDecisionByHuman(states.IMPACT_SIMULATED),
      draftChangeOrder(states.READY_FOR_APPROVAL, {
        expectedStateVersion: states.READY_FOR_APPROVAL.stateVersion,
      }),
    ]

    expect(checks.every((result) => !result.success)).toBe(true)
    expect(checks.every((result, index) => result.state.stateVersion === [
      states.OPTION_SELECTED,
      states.APPROVED,
      states.APPROVED,
      states.READY_FOR_APPROVAL,
      states.READY_FOR_APPROVAL,
      states.OPTIONS_AVAILABLE,
      states.OPTION_SELECTED,
      states.IMPACT_SIMULATED,
      states.READY_FOR_APPROVAL,
    ][index]?.stateVersion)).toBe(true)
  })
})

function buildHeroStates() {
  const INVESTIGATING = createInitialDecisionState()
  const OPTIONS_AVAILABLE = requireSuccess(
    evaluateResolutionOptions(INVESTIGATING, { expectedStateVersion: 1 }),
  )
  const CONSTRAINED = requireSuccess(
    upsertHumanConstraint(OPTIONS_AVAILABLE, {
      label: "Electrical riser",
      geometry: DEFAULT_CONSTRAINT_RECT,
    }),
  )
  const REVISED = requireSuccess(
    reviseResolutionOption(CONSTRAINED, {
      optionId: "OPTION-A",
      expectedOptionRevision: 1,
      expectedStateVersion: CONSTRAINED.stateVersion,
    }),
  )
  const OPTION_SELECTED = requireSuccess(selectResolutionOption(REVISED, "OPTION-A"))
  const IMPACT_SIMULATED = requireSuccess(
    simulateProjectImpact(OPTION_SELECTED, {
      preserveInspectionMilestone: true,
      expectedStateVersion: OPTION_SELECTED.stateVersion,
    }),
  )
  const READY_FOR_APPROVAL = requireSuccess(
    prepareChangeDecision(IMPACT_SIMULATED, {
      expectedStateVersion: IMPACT_SIMULATED.stateVersion,
    }),
  )
  const APPROVED = requireSuccess(approveDecisionByHuman(READY_FOR_APPROVAL))

  return {
    INVESTIGATING,
    OPTIONS_AVAILABLE,
    CONSTRAINED,
    REVISED,
    OPTION_SELECTED,
    IMPACT_SIMULATED,
    READY_FOR_APPROVAL,
    APPROVED,
  }
}

function requireSuccess(result: DomainResult): DecisionRoomState {
  if (!result.success) {
    throw new Error(result.message)
  }

  return result.state
}
