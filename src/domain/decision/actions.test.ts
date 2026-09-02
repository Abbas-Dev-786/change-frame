import { describe, expect, it } from "vitest"

import {
  DEFAULT_CONSTRAINT_RECT,
  approveDecisionByHuman,
  createInitialDecisionState,
  draftChangeOrder,
  evaluateResolutionOptions,
  prepareChangeDecision,
  reviseResolutionOption,
  routeIntersectsRect,
  selectResolutionOption,
  simulateProjectImpact,
  upsertHumanConstraint,
  type DomainResult,
} from "./index"

describe("decision state machine", () => {
  it("starts from the canonical issue state", () => {
    const state = createInitialDecisionState()

    expect(state.phase).toBe("INVESTIGATING")
    expect(state.stateVersion).toBe(1)
    expect(state.activeIssue.id).toBe("ISS-019")
    expect(state.resolutionOptions).toHaveLength(0)
  })

  it("evaluates exactly three options and rejects a stale replay", () => {
    const initialState = createInitialDecisionState()
    const evaluated = evaluateResolutionOptions(
      initialState,
      { expectedStateVersion: 1 },
      "2026-09-02T10:01:00.000Z",
    )

    expect(evaluated.success).toBe(true)

    if (!evaluated.success) {
      return
    }

    expect(evaluated.state.phase).toBe("OPTIONS_AVAILABLE")
    expect(evaluated.state.stateVersion).toBe(2)
    expect(evaluated.state.resolutionOptions).toHaveLength(3)

    const staleReplay = evaluateResolutionOptions(evaluated.state, {
      expectedStateVersion: 1,
    })

    expect(staleReplay.success).toBe(false)

    if (staleReplay.success) {
      return
    }

    expect(staleReplay.error).toBe("STATE_CONFLICT")
    expect(staleReplay.state.resolutionOptions).toHaveLength(3)
  })

  it("replaces CONSTRAINT-12 in place and preserves its createdAt timestamp", () => {
    const evaluated = requireSuccess(
      evaluateResolutionOptions(createInitialDecisionState(), {
        expectedStateVersion: 1,
      }),
    )
    const firstConstraint = requireSuccess(
      upsertHumanConstraint(
        evaluated,
        {
          label: "Electrical riser",
          geometry: DEFAULT_CONSTRAINT_RECT,
        },
        "2026-09-02T10:02:00.000Z",
      ),
    )
    const selected = requireSuccess(selectResolutionOption(firstConstraint, "OPTION-A"))
    const replacement = requireSuccess(
      upsertHumanConstraint(
        selected,
        {
          label: "Electrical riser replacement",
          geometry: { x: 500, y: 160, width: 90, height: 120 },
        },
        "2026-09-02T10:03:00.000Z",
      ),
    )

    expect(replacement.phase).toBe("OPTIONS_AVAILABLE")
    expect(replacement.selectedOptionId).toBeNull()
    expect(replacement.constraints).toHaveLength(1)
    expect(replacement.constraints[0]?.id).toBe("CONSTRAINT-12")
    expect(replacement.constraints[0]?.createdAt).toBe("2026-09-02T10:02:00.000Z")
    expect(replacement.constraints[0]?.updatedAt).toBe("2026-09-02T10:03:00.000Z")
  })

  it("revises Option A to Corridor C East without intersecting the human constraint", () => {
    const evaluated = requireSuccess(
      evaluateResolutionOptions(createInitialDecisionState(), {
        expectedStateVersion: 1,
      }),
    )
    const constrained = requireSuccess(
      upsertHumanConstraint(
        evaluated,
        {
          label: "Electrical riser",
          geometry: DEFAULT_CONSTRAINT_RECT,
        },
        "2026-09-02T10:04:00.000Z",
      ),
    )
    const revised = requireSuccess(
      reviseResolutionOption(
        constrained,
        {
          optionId: "OPTION-A",
          expectedOptionRevision: 1,
          expectedStateVersion: constrained.stateVersion,
        },
        "2026-09-02T10:05:00.000Z",
      ),
    )
    const optionA = revised.resolutionOptions.find((option) => option.id === "OPTION-A")
    const constraint = revised.constraints[0]

    expect(optionA?.revision).toBe(2)
    expect(optionA?.costImpact).toBe(5300)
    expect(optionA?.scheduleImpactDays).toBe(1)
    expect(optionA?.constraintIds).toEqual(["CONSTRAINT-12"])
    expect(optionA && constraint ? routeIntersectsRect(optionA.routeOverlay, constraint.geometry) : true).toBe(false)
  })

  it("simulates impact, prepares a decision, and requires human approval before drafting", () => {
    const evaluated = requireSuccess(
      evaluateResolutionOptions(createInitialDecisionState(), {
        expectedStateVersion: 1,
      }),
    )
    const constrained = requireSuccess(
      upsertHumanConstraint(evaluated, {
        label: "Electrical riser",
        geometry: DEFAULT_CONSTRAINT_RECT,
      }),
    )
    const revised = requireSuccess(
      reviseResolutionOption(constrained, {
        optionId: "OPTION-A",
        expectedOptionRevision: 1,
        expectedStateVersion: constrained.stateVersion,
      }),
    )
    const selected = requireSuccess(selectResolutionOption(revised, "OPTION-A"))
    const simulated = requireSuccess(
      simulateProjectImpact(selected, {
        preserveInspectionMilestone: true,
        expectedStateVersion: selected.stateVersion,
      }),
    )

    expect(simulated.phase).toBe("IMPACT_SIMULATED")
    expect(simulated.impactSimulation?.baseChangeCost).toBe(5300)
    expect(simulated.impactSimulation?.mitigation?.additionalCost).toBe(1200)
    expect(simulated.impactSimulation?.totalCostImpact).toBe(6500)
    expect(simulated.impactSimulation?.finalScheduleImpactDays).toBe(0)
    expect(simulated.impactSimulation?.projectedBudget).toBe(8426500)

    const prepared = requireSuccess(
      prepareChangeDecision(simulated, {
        expectedStateVersion: simulated.stateVersion,
      }),
    )

    expect(prepared.phase).toBe("READY_FOR_APPROVAL")
    expect(prepared.decision?.id).toBe("DEC-019")
    expect(prepared.decision?.approvedAt).toBeNull()

    const prematureDraft = draftChangeOrder(prepared, {
      expectedStateVersion: prepared.stateVersion,
    })

    expect(prematureDraft.success).toBe(false)

    if (!prematureDraft.success) {
      expect(prematureDraft.error).toBe("HUMAN_APPROVAL_REQUIRED")
    }

    const approved = requireSuccess(
      approveDecisionByHuman(prepared, "2026-09-02T10:10:00.000Z"),
    )

    expect(approved.phase).toBe("APPROVED")
    expect(approved.decision?.approvedAt).toBe("2026-09-02T10:10:00.000Z")
  })
})

function requireSuccess(result: DomainResult) {
  if (!result.success) {
    throw new Error(result.message)
  }

  return result.state
}
