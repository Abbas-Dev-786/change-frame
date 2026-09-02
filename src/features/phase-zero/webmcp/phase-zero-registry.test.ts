import { afterEach, describe, expect, it, vi } from "vitest"

import {
  PHASE_ZERO_TOOL_NAME,
  type PhaseZeroToolInput,
  type PhaseZeroToolResult,
} from "../model/phase-zero"
import type { ModelContextTool } from "./model-context"
import {
  ensurePhaseZeroToolRegistered,
  getPhaseZeroSnapshot,
  resetPhaseZeroRegistryForTests,
} from "./phase-zero-registry"

type RegisteredTool = ModelContextTool<
  PhaseZeroToolInput,
  PhaseZeroToolResult
>

function setModelContext(value?: object): void {
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value,
  })
}

afterEach(() => {
  resetPhaseZeroRegistryForTests()
  setModelContext(undefined)
})

describe("Phase 0 WebMCP registry", () => {
  it("reports unsupported browsers without throwing", async () => {
    setModelContext(undefined)

    await expect(ensurePhaseZeroToolRegistered()).resolves.toBeUndefined()

    expect(getPhaseZeroSnapshot().status).toBe("unsupported")
    expect(getPhaseZeroSnapshot().modelContextAvailable).toBe(false)
  })

  it("registers one read-only tool and returns the readiness payload", async () => {
    let registeredTool: RegisteredTool | undefined
    const registerTool = vi.fn(async (tool: RegisteredTool) => {
      registeredTool = tool
    })
    setModelContext({ registerTool })

    await ensurePhaseZeroToolRegistered()
    await ensurePhaseZeroToolRegistered()

    expect(registerTool).toHaveBeenCalledTimes(1)
    expect(registeredTool?.name).toBe(PHASE_ZERO_TOOL_NAME)
    expect(registeredTool?.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: false,
    })
    expect(registeredTool?.inputSchema).toMatchObject({
      type: "object",
      additionalProperties: false,
    })

    const result = await registeredTool?.execute({})

    expect(result).toMatchObject({
      success: true,
      data: {
        application: "ChangeDecision OS",
        phase: "PHASE_0",
        status: "ready",
      },
    })
    expect(getPhaseZeroSnapshot()).toMatchObject({
      status: "registered",
      invocationCount: 1,
    })
  })

  it("rejects an execution that was already cancelled", async () => {
    let registeredTool: RegisteredTool | undefined
    setModelContext({
      registerTool: async (tool: RegisteredTool) => {
        registeredTool = tool
      },
    })
    await ensurePhaseZeroToolRegistered()
    const controller = new AbortController()
    controller.abort()

    await expect(
      registeredTool?.execute({}, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" })
    expect(getPhaseZeroSnapshot().invocationCount).toBe(0)
  })

  it("allows registration to be retried after a browser API failure", async () => {
    const registerTool = vi
      .fn()
      .mockRejectedValueOnce(new Error("Temporary registration failure."))
      .mockResolvedValueOnce(undefined)
    setModelContext({ registerTool })

    await ensurePhaseZeroToolRegistered()
    expect(getPhaseZeroSnapshot()).toMatchObject({
      status: "error",
      error: "Temporary registration failure.",
    })

    await ensurePhaseZeroToolRegistered()
    expect(registerTool).toHaveBeenCalledTimes(2)
    expect(getPhaseZeroSnapshot()).toMatchObject({
      status: "registered",
      error: null,
    })
  })
})
