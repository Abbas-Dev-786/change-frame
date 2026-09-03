import { afterEach, describe, expect, it } from "vitest"
import { createInitialDecisionState } from "@/src/domain/decision"
import { useDecisionRoomStore } from "@/src/store/decision-room-store"
import { agentOptions, testContext } from "@/src/test/decision-fixture"
import { resetFlightRecorderForTests } from "@/src/observability/agent-flight-recorder"
import type { WebMcpToolDescriptor } from "./model-context"
import { getDecisionToolRegistryStatus, resetDecisionToolRegistryForTests, startDecisionToolRegistry, waitForDecisionToolRegistryCoherence } from "./decision-tool-registry"

type RegisteredTool = { descriptor: WebMcpToolDescriptor; active: boolean }
const registered = new Map<string, RegisteredTool>()

afterEach(() => {
  resetDecisionToolRegistryForTests(); resetFlightRecorderForTests(); window.sessionStorage.clear(); registered.clear()
  useDecisionRoomStore.setState(createInitialDecisionState())
  Object.defineProperty(document, "modelContext", { configurable: true, value: undefined })
})

describe("dynamic WebMCP capability registry", () => {
  it("moves from live context ingestion to agent-authored options and human-gated impact", async () => {
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool: async (descriptor: WebMcpToolDescriptor, options?: { signal?: AbortSignal }) => {
        registered.set(descriptor.name, { descriptor, active: true })
        options?.signal?.addEventListener("abort", () => { const tool = registered.get(descriptor.name); if (tool) tool.active = false }, { once: true })
      } },
    })

    startDecisionToolRegistry(); await waitForDecisionToolRegistryCoherence()
    expect(activeToolNames()).toEqual(["get_decision_context", "get_user_constraints", "configure_decision_context", "evaluate_resolution_options"])

    const configured = await tool("configure_decision_context").execute({ ...testContext, source: undefined, expectedStateVersion: 1 })
    expect(configured.success).toBe(false)

    const { source: _source, ...contextInput } = testContext
    const contextResult = await tool("configure_decision_context").execute({ ...contextInput, expectedStateVersion: 1 })
    expect(contextResult.success).toBe(true)
    expect(activeToolNames()).toContain("evaluate_resolution_options")

    const optionResult = await tool("evaluate_resolution_options").execute({ expectedStateVersion: 2, options: agentOptions })
    expect(optionResult.success).toBe(true)
    expect(activeToolNames()).not.toContain("evaluate_resolution_options")
    expect(Object.keys(Object.fromEntries(registered)).includes("approve_decision")).toBe(false)

    useDecisionRoomStore.getState().selectOption("ALT-NORTH")
    await waitForDecisionToolRegistryCoherence()
    expect(activeToolNames()).toContain("simulate_project_impact")
  })
})

function activeToolNames() { return getDecisionToolRegistryStatus().registeredTools }
function tool(name: string): WebMcpToolDescriptor {
  const value = registered.get(name)
  if (!value?.active) throw new Error(`${name} is not active`)
  return value.descriptor
}
