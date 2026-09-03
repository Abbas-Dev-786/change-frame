import { describe, expect, it } from "vitest"
import { availableToolNames } from "@/src/webmcp/tool-data"
import { agentOptions, createConfiguredTestState } from "@/src/test/decision-fixture"
import { evaluateResolutionOptions, selectResolutionOption, type DomainResult } from "."

describe("agentic workflow capability matrix", () => {
  it("exposes context configuration before a project exists", async () => {
    const { createInitialDecisionState } = await import(".")
    expect(availableToolNames(createInitialDecisionState())).toContain("configure_decision_context")
    expect(availableToolNames(createInitialDecisionState())).toContain("evaluate_resolution_options")
  })

  it("enables proposal submission only after live context exists", () => {
    const configured = createConfiguredTestState()
    expect(availableToolNames(configured)).toContain("evaluate_resolution_options")
    const evaluated = requireSuccess(evaluateResolutionOptions(configured, { expectedStateVersion: configured.stateVersion, options: agentOptions }))
    expect(availableToolNames(evaluated)).not.toContain("evaluate_resolution_options")
  })

  it("never exposes selection or approval as agent tools", () => {
    const configured = createConfiguredTestState()
    const evaluated = requireSuccess(evaluateResolutionOptions(configured, { expectedStateVersion: configured.stateVersion, options: agentOptions }))
    const selected = requireSuccess(selectResolutionOption(evaluated, "ALT-NORTH"))
    expect(availableToolNames(evaluated)).not.toContain("select_resolution_option")
    expect(availableToolNames(selected)).not.toContain("approve_decision")
  })
})

function requireSuccess(result: DomainResult) {
  if (!result.success) throw new Error(result.message)
  return result.state
}
