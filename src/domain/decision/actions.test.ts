import { describe, expect, it } from "vitest"

import {
  DEFAULT_CONSTRAINT_RECT,
  approveDecisionByHuman,
  createInitialDecisionState,
  draftChangeOrder,
  evaluateResolutionOptions,
  prepareChangeDecision,
  rejectResolutionOption,
  resetDecisionRoom,
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
    const revised = requireSuccess(
      reviseResolutionOption(firstConstraint, {
        optionId: "OPTION-A",
        expectedOptionRevision: 1,
        expectedStateVersion: firstConstraint.stateVersion,
      }),
    )
    const selected = requireSuccess(selectResolutionOption(revised, "OPTION-A"))
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

  it("records human rejection reasons and prevents rejected option selection", () => {
    const evaluated = requireSuccess(
      evaluateResolutionOptions(createInitialDecisionState(), {
        expectedStateVersion: 1,
      }),
    )
    const rejected = requireSuccess(
      rejectResolutionOption(
        evaluated,
        {
          optionId: "OPTION-B",
          reason: "requires_engineering_review",
        },
        "2026-09-02T10:06:00.000Z",
      ),
    )
    const optionB = rejected.resolutionOptions.find((option) => option.id === "OPTION-B")

    expect(optionB?.status).toBe("rejected")
    expect(optionB?.rejectionReason).toBe("requires_engineering_review")
    expect(rejected.activityLog[0]?.label).toBe("Option rejected")
    expect(rejected.activityLog[0]?.detail).toBe("OPTION-B rejected: Requires engineering review.")

    const selectedRejectedOption = selectResolutionOption(rejected, "OPTION-B")

    expect(selectedRejectedOption.success).toBe(false)

    if (!selectedRejectedOption.success) {
      expect(selectedRejectedOption.error).toBe("INVALID_STATE")
    }
  })

  it("simulates impact, prepares a decision, and drafts one duplicate-safe change order after human approval", () => {
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

    const drafted = requireSuccess(
      draftChangeOrder(approved, {
        expectedStateVersion: approved.stateVersion,
      }),
    )

    expect(drafted.phase).toBe("CHANGE_ORDER_DRAFTED")
    expect(drafted.changeOrder?.id).toBe("CO-007")
    expect(drafted.changeOrder?.decisionId).toBe("DEC-019")
    expect(drafted.changeOrder?.costImpact).toBe(6500)
    expect(drafted.changeOrder?.scheduleImpactDays).toBe(0)
    expect(drafted.activityLog.filter((event) => event.type === "change_order_drafted")).toHaveLength(1)

    const staleDraftReplay = draftChangeOrder(drafted, {
      expectedStateVersion: approved.stateVersion,
    })

    expect(staleDraftReplay.success).toBe(false)

    if (!staleDraftReplay.success) {
      expect(staleDraftReplay.error).toBe("STATE_CONFLICT")
      expect(staleDraftReplay.state.changeOrder?.id).toBe("CO-007")
    }

    const duplicateSafeDraft = requireSuccess(
      draftChangeOrder(drafted, {
        expectedStateVersion: drafted.stateVersion,
      }),
    )

    expect(duplicateSafeDraft.stateVersion).toBe(drafted.stateVersion)
    expect(duplicateSafeDraft.activityLog.filter((event) => event.type === "change_order_drafted")).toHaveLength(1)
  })

  it("blocks selection until a constrained option is successfully revised", () => {
    const evaluated = requireSuccess(
      evaluateResolutionOptions(createInitialDecisionState(), { expectedStateVersion: 1 }),
    )
    const constrained = requireSuccess(
      upsertHumanConstraint(evaluated, {
        label: "Electrical riser",
        geometry: DEFAULT_CONSTRAINT_RECT,
      }),
    )

    const result = selectResolutionOption(constrained, "OPTION-A")

    expect(result.success).toBe(false)
    expect(result.state.stateVersion).toBe(constrained.stateVersion)
    expect(result.state.selectedOptionId).toBeNull()
    expect(result.success ? null : result.error).toBe("INVALID_STATE")
  })

  it("returns explicit geometry errors without mutating state", () => {
    const evaluated = requireSuccess(
      evaluateResolutionOptions(createInitialDecisionState(), { expectedStateVersion: 1 }),
    )
    const invalid = upsertHumanConstraint(evaluated, {
      label: "Bad coordinates",
      geometry: { x: Number.NaN, y: 10, width: 20, height: 20 },
    })

    expect(invalid.success).toBe(false)
    expect(invalid.state.stateVersion).toBe(evaluated.stateVersion)
    expect(invalid.state.constraints).toEqual(evaluated.constraints)
    expect(invalid.success ? null : invalid.error).toBe("INVALID_CONSTRAINT_GEOMETRY")

    const constrained = requireSuccess(
      upsertHumanConstraint(evaluated, {
        label: "Blocks the supported east reroute",
        geometry: { x: 440, y: 360, width: 280, height: 60 },
      }),
    )
    const unsupported = reviseResolutionOption(constrained, {
      optionId: "OPTION-A",
      expectedOptionRevision: 1,
      expectedStateVersion: constrained.stateVersion,
    })

    expect(unsupported.success).toBe(false)
    expect(unsupported.state.stateVersion).toBe(constrained.stateVersion)
    expect(unsupported.state.resolutionOptions).toEqual(constrained.resolutionOptions)
    expect(unsupported.success ? null : unsupported.error).toBe("UNSUPPORTED_CONSTRAINT_GEOMETRY")
  })

  it("keeps state-version concurrency tokens monotonic across repeated resets", () => {
    const initial = createInitialDecisionState()
    const firstReset = resetDecisionRoom(initial, createInitialDecisionState)
    const secondReset = resetDecisionRoom(firstReset, createInitialDecisionState)

    expect(firstReset.stateVersion).toBe(2)
    expect(secondReset.stateVersion).toBe(3)
  })

  it("does not add milestone mitigation cost to a zero-delay resize strategy", () => {
    const evaluated = requireSuccess(
      evaluateResolutionOptions(createInitialDecisionState(), { expectedStateVersion: 1 }),
    )
    const selected = requireSuccess(selectResolutionOption(evaluated, "OPTION-B"))
    const simulated = requireSuccess(
      simulateProjectImpact(selected, {
        preserveInspectionMilestone: true,
        expectedStateVersion: selected.stateVersion,
      }),
    )

    expect(simulated.impactSimulation?.mitigation).toBeNull()
    expect(simulated.impactSimulation?.totalCostImpact).toBe(2100)
  })

  it.each([
    ["OPTION-B", "Resize and flatten the D22 duct section through the conflict zone."],
    ["OPTION-C", "Split D22 into two smaller supply branches around structural beam B14. Add a second MEP crew to preserve the inspection milestone."],
  ] as const)("drafts strategy-aware scope for %s", (optionId, expectedScope) => {
    const evaluated = requireSuccess(
      evaluateResolutionOptions(createInitialDecisionState(), { expectedStateVersion: 1 }),
    )
    const selected = requireSuccess(selectResolutionOption(evaluated, optionId))
    const simulated = requireSuccess(
      simulateProjectImpact(selected, {
        preserveInspectionMilestone: true,
        expectedStateVersion: selected.stateVersion,
      }),
    )
    const prepared = requireSuccess(
      prepareChangeDecision(simulated, { expectedStateVersion: simulated.stateVersion }),
    )
    const approved = requireSuccess(approveDecisionByHuman(prepared))
    const drafted = requireSuccess(
      draftChangeOrder(approved, { expectedStateVersion: approved.stateVersion }),
    )

    expect(drafted.decision?.optionRevision).toBe(1)
    expect(drafted.changeOrder?.scope).toBe(expectedScope)
  })

  it("locks rejection after approval preparation", () => {
    const evaluated = requireSuccess(
      evaluateResolutionOptions(createInitialDecisionState(), { expectedStateVersion: 1 }),
    )
    const selected = requireSuccess(selectResolutionOption(evaluated, "OPTION-B"))
    const simulated = requireSuccess(
      simulateProjectImpact(selected, {
        preserveInspectionMilestone: false,
        expectedStateVersion: selected.stateVersion,
      }),
    )
    const prepared = requireSuccess(
      prepareChangeDecision(simulated, { expectedStateVersion: simulated.stateVersion }),
    )
    const rejected = rejectResolutionOption(prepared, {
      optionId: "OPTION-B",
      reason: "too_risky",
    })

    expect(rejected.success).toBe(false)
    expect(rejected.state.stateVersion).toBe(prepared.stateVersion)
    expect(rejected.state.decision).toEqual(prepared.decision)
  })
})

function requireSuccess(result: DomainResult) {
  if (!result.success) {
    throw new Error(result.message)
  }

  return result.state
}
