import { describe, expect, it } from "vitest"
import { agentOptions, testContext } from "@/src/test/decision-fixture"
import { parseConfigureContextInput, parseEmptyInput, parseEvaluateOptionsInput, parseReviseOptionInput, parseSimulateImpactInput } from "./input-guards"

describe("WebMCP runtime input guards", () => {
  it("accepts complete live context and rejects extra keys", () => {
    const { source: _source, ...context } = testContext
    expect(parseConfigureContextInput({ ...context, expectedStateVersion: 1 })).not.toBeNull()
    expect(parseConfigureContextInput({ ...context, expectedStateVersion: 1, injected: true })).toBeNull()
  })

  it("requires complete agent-authored alternatives", () => {
    expect(parseEmptyInput({})).toEqual({})
    expect(parseEvaluateOptionsInput({ expectedStateVersion: 2, options: agentOptions })).not.toBeNull()
    expect(parseEvaluateOptionsInput({ expectedStateVersion: 2, options: [{ id: "ALT" }] })).toBeNull()
  })

  it("validates complete revisions and optional mitigation", () => {
    const { id: _id, ...revision } = agentOptions[0]!
    expect(parseReviseOptionInput({ optionId: "ALT-NORTH", constraintIds: ["CONSTRAINT-1"], expectedOptionRevision: 1, expectedStateVersion: 4, revision })).not.toBeNull()
    expect(parseReviseOptionInput({ optionId: "ALT-NORTH", constraintIds: [], expectedOptionRevision: 1, expectedStateVersion: 4, revision })).toBeNull()
    expect(parseSimulateImpactInput({ expectedStateVersion: 5, mitigation: null })).not.toBeNull()
  })
})
