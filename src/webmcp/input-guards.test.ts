import { describe, expect, it } from "vitest"

import {
  parseEmptyInput,
  parseEvaluateOptionsInput,
  parseReviseOptionInput,
  parseSimulateImpactInput,
} from "./input-guards"

describe("WebMCP runtime input guards", () => {
  it("accepts only exact schema keys", () => {
    expect(parseEmptyInput({})).toEqual({})
    expect(parseEmptyInput({ ignored: true })).toBeNull()
    expect(parseEvaluateOptionsInput({ expectedStateVersion: 1 })).toEqual({
      expectedStateVersion: 1,
    })
    expect(parseEvaluateOptionsInput({ expectedStateVersion: 1, injected: true })).toBeNull()
    expect(parseSimulateImpactInput({
      preserveInspectionMilestone: true,
      expectedStateVersion: 4,
    })).not.toBeNull()
    expect(parseSimulateImpactInput({
      preserveInspectionMilestone: true,
      expectedStateVersion: 4,
      extra: "no",
    })).toBeNull()
  })

  it("rejects malformed revisions and constraint identities", () => {
    expect(parseReviseOptionInput({
      optionId: "OPTION-A",
      constraintIds: ["CONSTRAINT-12"],
      expectedOptionRevision: 1,
      expectedStateVersion: 3,
    })).not.toBeNull()
    expect(parseReviseOptionInput({
      optionId: "OPTION-A",
      constraintIds: ["CONSTRAINT-12", "CONSTRAINT-13"],
      expectedOptionRevision: 1,
      expectedStateVersion: 3,
    })).toBeNull()
    expect(parseReviseOptionInput({
      optionId: "OPTION-A",
      constraintIds: ["CONSTRAINT-12"],
      expectedOptionRevision: 1.5,
      expectedStateVersion: 3,
    })).toBeNull()
  })
})
