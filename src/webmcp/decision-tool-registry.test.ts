import { afterEach, describe, expect, it } from "vitest"

import { createInitialDecisionState, DEFAULT_CONSTRAINT_RECT } from "@/src/domain/decision"
import { useDecisionRoomStore } from "@/src/store/decision-room-store"
import type { WebMcpToolDescriptor } from "./model-context"
import {
  getDecisionToolRegistryStatus,
  resetDecisionToolRegistryForTests,
  startDecisionToolRegistry,
  waitForDecisionToolRegistryCoherence,
} from "./decision-tool-registry"

type RegisteredTool = {
  descriptor: WebMcpToolDescriptor
  active: boolean
  signal?: AbortSignal
}

const registeredTools = new Map<string, RegisteredTool>()

afterEach(() => {
  resetDecisionToolRegistryForTests()
  window.sessionStorage.clear()
  registeredTools.clear()
  useDecisionRoomStore.setState(createInitialDecisionState())
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: undefined,
  })
})

describe("decision WebMCP registry", () => {
  it("registers tools according to the canonical phase table", async () => {
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: async (
          descriptor: WebMcpToolDescriptor,
          options?: { signal?: AbortSignal },
        ) => {
          registeredTools.set(descriptor.name, {
            descriptor,
            active: true,
            signal: options?.signal,
          })

          options?.signal?.addEventListener("abort", () => {
            const tool = registeredTools.get(descriptor.name)

            if (tool) {
              tool.active = false
            }
          }, { once: true })
        },
      },
    })

    startDecisionToolRegistry()
    await waitForDecisionToolRegistryCoherence()

    expect(activeToolNames()).toEqual([
      "get_decision_context",
      "get_user_constraints",
      "evaluate_resolution_options",
    ])

    const contextTool = getRegisteredTool("get_decision_context")
    const contextResult = await contextTool.descriptor.execute({})

    expect(contextResult.success).toBe(true)

    if (contextResult.success) {
      expect(contextResult.data.phase).toBe("INVESTIGATING")
    }

    const evaluateTool = getRegisteredTool("evaluate_resolution_options")
    const evaluateResult = await evaluateTool.descriptor.execute({
      expectedStateVersion: 1,
    })

    expect(evaluateResult.success).toBe(true)
    expect(activeToolNames()).toEqual([
      "get_decision_context",
      "get_user_constraints",
    ])

    useDecisionRoomStore.getState().upsertConstraint({
      label: "Electrical riser",
      geometry: DEFAULT_CONSTRAINT_RECT,
    })
    await waitForDecisionToolRegistryCoherence()

    expect(activeToolNames()).toEqual([
      "get_decision_context",
      "get_user_constraints",
      "revise_resolution_option",
    ])

    const reviseTool = getRegisteredTool("revise_resolution_option")
    const reviseResult = await reviseTool.descriptor.execute({
      optionId: "OPTION-A",
      constraintIds: ["CONSTRAINT-12"],
      expectedOptionRevision: 1,
      expectedStateVersion: 3,
    })

    expect(reviseResult.success).toBe(true)

    useDecisionRoomStore.getState().selectOption("OPTION-A")
    await waitForDecisionToolRegistryCoherence()

    expect(activeToolNames()).toEqual([
      "get_decision_context",
      "get_user_constraints",
      "simulate_project_impact",
    ])

    const simulateTool = getRegisteredTool("simulate_project_impact")
    const simulateResult = await simulateTool.descriptor.execute({
      preserveInspectionMilestone: true,
      expectedStateVersion: 5,
    })

    expect(simulateResult.success).toBe(true)

    const prepareTool = getRegisteredTool("prepare_change_decision")
    const prepareResult = await prepareTool.descriptor.execute({
      expectedStateVersion: 6,
    })

    expect(prepareResult.success).toBe(true)
    expect(activeToolNames()).toEqual([
      "get_decision_context",
      "get_user_constraints",
    ])
    expect(registeredTools.has("approve_decision")).toBe(false)

    useDecisionRoomStore.getState().approveDecision()
    await waitForDecisionToolRegistryCoherence()

    expect(activeToolNames()).toEqual([
      "get_decision_context",
      "get_user_constraints",
      "draft_change_order",
    ])

    const draftTool = getRegisteredTool("draft_change_order")
    const draftResult = await draftTool.descriptor.execute({
      expectedStateVersion: 8,
    })

    expect(draftResult.success).toBe(true)

    if (draftResult.success) {
      const changeOrder = readRecord(draftResult.data.changeOrder)

      expect(changeOrder?.id).toBe("CO-007")
      expect(changeOrder?.status).toBe("draft")
      expect(draftResult.data.phase).toBe("CHANGE_ORDER_DRAFTED")
    }

    expect(activeToolNames()).toEqual([
      "get_decision_context",
      "get_user_constraints",
    ])
    expect(registeredTools.has("approve_decision")).toBe(false)

    const staleDraftReplay = await draftTool.descriptor.execute({
      expectedStateVersion: 8,
    })

    expect(staleDraftReplay.success).toBe(false)

    if (!staleDraftReplay.success) {
      expect(staleDraftReplay.error).toBe("STATE_CONFLICT")
      expect(useDecisionRoomStore.getState().changeOrder?.id).toBe("CO-007")
    }
  })

  it("owns registrations with AbortControllers and serializes rapid reconciliation", async () => {
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: async (
          descriptor: WebMcpToolDescriptor,
          options?: { signal?: AbortSignal },
        ) => {
          await Promise.resolve()
          registeredTools.set(descriptor.name, {
            descriptor,
            active: true,
            signal: options?.signal,
          })
          options?.signal?.addEventListener("abort", () => {
            const tool = registeredTools.get(descriptor.name)

            if (tool) {
              tool.active = false
            }
          }, { once: true })
        },
      },
    })

    startDecisionToolRegistry()
    await waitForDecisionToolRegistryCoherence()

    const evaluateRegistration = getRegisteredTool("evaluate_resolution_options")
    expect(evaluateRegistration.signal).toBeInstanceOf(AbortSignal)

    useDecisionRoomStore.getState().evaluateOptions()
    useDecisionRoomStore.getState().upsertConstraint({
      label: "Electrical riser",
      geometry: DEFAULT_CONSTRAINT_RECT,
    })
    await waitForDecisionToolRegistryCoherence()

    expect(evaluateRegistration.signal?.aborted).toBe(true)
    expect(activeToolNames()).toEqual([
      "get_decision_context",
      "get_user_constraints",
      "revise_resolution_option",
    ])
  })
})

function activeToolNames() {
  return getDecisionToolRegistryStatus().registeredTools
}

function getRegisteredTool(name: string): RegisteredTool {
  const tool = registeredTools.get(name)

  if (!tool || !tool.active) {
    throw new Error(`${name} is not active.`)
  }

  return tool
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}
