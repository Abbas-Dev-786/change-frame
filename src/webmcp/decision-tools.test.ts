import { describe, expect, it } from "vitest"
import { decisionTools } from "./decision-tools"

describe("WebMCP tool contracts", () => {
  it("exposes live-context and agent-authored reasoning tools", () => {
    expect(Object.keys(decisionTools)).toHaveLength(8)
    expect(decisionTools.configure_decision_context.description).toContain("current project brief")
    expect(decisionTools.evaluate_resolution_options.description).toContain("original, situation-specific alternatives")
    expect(decisionTools.revise_resolution_option.description).toContain("complete revised rationale")
    expect(decisionTools.simulate_project_impact.description).toContain("does not invent values")
  })

  it("never exposes autonomous human selection or approval", () => {
    expect("select_resolution_option" in decisionTools).toBe(false)
    expect("approve_decision" in decisionTools).toBe(false)
    expect(decisionTools.get_decision_context.annotations.untrustedContentHint).toBe(true)
    expect(decisionTools.evaluate_resolution_options.inputSchema.properties?.options).toBeDefined()
  })
})
