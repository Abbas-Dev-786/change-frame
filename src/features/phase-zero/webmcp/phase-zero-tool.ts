import {
  PHASE_ZERO_TOOL_NAME,
  type PhaseZeroToolInput,
  type PhaseZeroToolResult,
} from "../model/phase-zero"
import {
  readEnvironmentDiagnostics,
  type ModelContextTool,
} from "./model-context"

type InvocationObserver = (invokedAt: string) => void

export function createPhaseZeroTool(
  onInvoked: InvocationObserver,
): ModelContextTool<PhaseZeroToolInput, PhaseZeroToolResult> {
  return {
    name: PHASE_ZERO_TOOL_NAME,
    title: "Get Phase Zero Status",
    description:
      "Verify that the ChangeDecision OS WebMCP compatibility spike is registered and callable. This read-only tool returns deployment and API diagnostics without changing application state.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: false,
    },
    execute: async (_input, options) => {
      if (options?.signal?.aborted) {
        throw new DOMException("Tool execution was cancelled.", "AbortError")
      }

      const invokedAt = new Date().toISOString()
      onInvoked(invokedAt)
      const environment = readEnvironmentDiagnostics()

      return {
        success: true,
        data: {
          application: "ChangeDecision OS",
          phase: "PHASE_0",
          status: "ready",
          webMcpApi: "imperative",
          secureContext: environment.secureContext,
          originAgentCluster: environment.originAgentCluster,
          message: "Phase 0 WebMCP registration and invocation succeeded.",
        },
      }
    },
  }
}
