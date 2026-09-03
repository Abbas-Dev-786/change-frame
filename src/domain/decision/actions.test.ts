import { describe, expect, it } from "vitest"
import { agentOptions, createConfiguredTestState, testContext } from "@/src/test/decision-fixture"
import {
  approveDecisionByHuman,
  configureDecisionContext,
  createInitialDecisionState,
  draftChangeOrder,
  evaluateResolutionOptions,
  prepareChangeDecision,
  reviseResolutionOption,
  selectResolutionOption,
  simulateProjectImpact,
  upsertHumanConstraint,
  type DecisionRoomState,
  type DomainResult,
} from "."

describe("open-ended decision domain", () => {
  it("starts with a replaceable project context but no canned answer", () => {
    const state = createInitialDecisionState()
    expect(state.contextConfigured).toBe(true)
    expect(state.contextSource).toBe("starter")
    expect(state.resolutionOptions).toEqual([])
    expect(state.project.id).toBe("PROJECT-01")
  })

  it("accepts arbitrary internally consistent project context", () => {
    const initial = createInitialDecisionState()
    const configured = requireSuccess(configureDecisionContext(initial, { ...testContext, expectedStateVersion: 1 }))
    expect(configured.project.name).toBe("Harbor Medical Center")
    expect(configured.activeIssue.id).toBe("ISS-VENT-42")
    expect(configured.contextSource).toBe("agent")
  })

  it("materializes original agent-authored options with rationale and confidence", () => {
    const configured = createConfiguredTestState()
    const evaluated = requireSuccess(evaluateResolutionOptions(configured, { expectedStateVersion: configured.stateVersion, options: agentOptions }))
    expect(evaluated.resolutionOptions.map((option) => option.id)).toEqual(["ALT-NORTH", "ALT-REDUCE"])
    expect(evaluated.resolutionOptions[0]?.authoredBy).toBe("agent")
    expect(evaluated.resolutionOptions[0]?.rationale).toContain("fixed equipment")
    expect(evaluated.resolutionOptions[0]?.confidence).toBe(0.78)
  })

  it("rejects stale calls and malformed proposal sets without side effects", () => {
    const configured = createConfiguredTestState()
    const stale = evaluateResolutionOptions(configured, { expectedStateVersion: 1, options: agentOptions })
    expect(stale.success).toBe(false)
    if (!stale.success) expect(stale.error).toBe("STATE_CONFLICT")

    const duplicate = evaluateResolutionOptions(configured, { expectedStateVersion: configured.stateVersion, options: [agentOptions[0]!, agentOptions[0]!] })
    expect(duplicate.success).toBe(false)
    if (!duplicate.success) expect(duplicate.error).toBe("INVALID_OPTIONS")
    expect(duplicate.state.resolutionOptions).toEqual([])
  })

  it("marks intersecting routes and accepts only an agent-authored revision that clears the constraint", () => {
    const evaluated = evaluatedState()
    const constrained = requireSuccess(upsertHumanConstraint(evaluated, { label: "No access", geometry: { x: 250, y: 210, width: 120, height: 100 } }))
    expect(constrained.resolutionOptions.find((option) => option.id === "ALT-NORTH")?.status).toBe("needs_revision")

    const failed = reviseResolutionOption(constrained, {
      optionId: "ALT-NORTH",
      constraintIds: ["CONSTRAINT-1"],
      expectedOptionRevision: 1,
      expectedStateVersion: constrained.stateVersion,
      revision: { ...withoutId(agentOptions[0]!), route: { label: "Still blocked", points: [{ x: 80, y: 250 }, { x: 650, y: 250 }] } },
    })
    expect(failed.success).toBe(false)
    if (!failed.success) expect(failed.error).toBe("UNSUPPORTED_CONSTRAINT_GEOMETRY")

    const revised = requireSuccess(reviseResolutionOption(constrained, {
      optionId: "ALT-NORTH",
      constraintIds: ["CONSTRAINT-1"],
      expectedOptionRevision: 1,
      expectedStateVersion: constrained.stateVersion,
      revision: { ...withoutId(agentOptions[0]!), confidence: 0.82, route: { label: "South bypass", points: [{ x: 80, y: 380 }, { x: 650, y: 380 }] } },
    }))
    expect(revised.resolutionOptions[0]?.revision).toBe(2)
    expect(revised.resolutionOptions[0]?.status).toBe("revised")
  })

  it("keeps selection and approval human-only while calculating agent-authored mitigation", () => {
    const evaluated = evaluatedState()
    const selected = requireSuccess(selectResolutionOption(evaluated, "ALT-NORTH"))
    const simulated = requireSuccess(simulateProjectImpact(selected, {
      expectedStateVersion: selected.stateVersion,
      mitigation: { id: "MIT-NIGHT", type: "shift-change", label: "Add a night shift", rationale: "Recovers one installation day.", additionalCost: 1800, daysRecovered: 1, confidence: 0.7 },
    }))
    expect(simulated.impactSimulation?.totalCostImpact).toBe(9000)
    expect(simulated.impactSimulation?.finalScheduleImpactDays).toBe(1)
    expect(simulated.impactSimulation?.mitigation?.authoredBy).toBe("agent")

    const prepared = requireSuccess(prepareChangeDecision(simulated, { expectedStateVersion: simulated.stateVersion }))
    const blockedDraft = draftChangeOrder(prepared, { expectedStateVersion: prepared.stateVersion })
    expect(blockedDraft.success).toBe(false)
    if (!blockedDraft.success) expect(blockedDraft.error).toBe("HUMAN_APPROVAL_REQUIRED")

    const approved = requireSuccess(approveDecisionByHuman(prepared))
    const drafted = requireSuccess(draftChangeOrder(approved, { expectedStateVersion: approved.stateVersion }))
    expect(drafted.changeOrder?.reason).toBe(testContext.activeIssue.description)
    expect(drafted.changeOrder?.scope).toContain(agentOptions[0]?.description)
  })
})

function evaluatedState(): DecisionRoomState {
  const configured = createConfiguredTestState()
  return requireSuccess(evaluateResolutionOptions(configured, { expectedStateVersion: configured.stateVersion, options: agentOptions }))
}

function withoutId(option: typeof agentOptions[number]) {
  const { id: _id, ...rest } = option
  return rest
}

function requireSuccess(result: DomainResult): DecisionRoomState {
  if (!result.success) throw new Error(result.message)
  return result.state
}
