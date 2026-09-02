export const PHASE_ZERO_TOOL_NAME = "get_phase_zero_status"

export type RegistrationStatus =
  | "checking"
  | "registered"
  | "unsupported"
  | "error"

export type EnvironmentDiagnostics = {
  secureContext: boolean
  originAgentCluster: boolean
  modelContextAvailable: boolean
}

export type PhaseZeroSnapshot = EnvironmentDiagnostics & {
  status: RegistrationStatus
  invocationCount: number
  lastInvokedAt: string | null
  error: string | null
}

export type PhaseZeroToolInput = Record<string, never>

export type PhaseZeroToolResult = {
  success: true
  data: {
    application: "ChangeDecision OS"
    phase: "PHASE_0"
    status: "ready"
    webMcpApi: "imperative"
    secureContext: boolean
    originAgentCluster: boolean
    message: string
  }
}
