import { afterEach, describe, expect, it } from "vitest"

import {
  getFlightRecorderSnapshot,
  observeDecisionToolExecution,
  recordHumanDecisionAction,
  resetFlightRecorderForTests,
} from "./agent-flight-recorder"
import { createInitialDecisionState } from "@/src/domain/decision"

afterEach(() => resetFlightRecorderForTests())

describe("agent flight recorder", () => {
  it("records redacted WebMCP spans with concurrency-token provenance", async () => {
    const response = await observeDecisionToolExecution(
      "evaluate_resolution_options",
      { expectedStateVersion: 3, privateNote: "must not be recorded" },
      3,
      async () => ({ success: true, stateVersion: 4, data: {} }),
    )

    expect(response.success).toBe(true)
    expect(getFlightRecorderSnapshot().events).toEqual([
      expect.objectContaining({
        actor: "agent",
        action: "evaluate_resolution_options",
        status: "success",
        stateVersionBefore: 3,
        stateVersionAfter: 4,
        expectedStateVersion: 3,
        errorCode: null,
      }),
    ])
    expect(JSON.stringify(getFlightRecorderSnapshot())).not.toContain("privateNote")
  })

  it("attributes protected interface actions to the human", () => {
    const state = createInitialDecisionState()

    recordHumanDecisionAction(
      "approve_decision",
      "Approved at the protected checkpoint.",
      7,
      { success: true, changed: true, state: { ...state, stateVersion: 8 } },
    )

    expect(getFlightRecorderSnapshot().events[0]).toEqual(
      expect.objectContaining({
        actor: "human",
        action: "approve_decision",
        stateVersionBefore: 7,
        stateVersionAfter: 8,
      }),
    )
  })
})
