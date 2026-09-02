import type { DecisionRoomState, DomainFailure, DomainResult } from "@/src/domain/decision"

export type WebMcpToolResponse =
  | {
      success: true
      stateVersion: number
      data: Record<string, unknown>
    }
  | {
      success: false
      stateVersion: number
      error: string
      message: string
      retryable: boolean
    }

export function successResponse(
  state: DecisionRoomState,
  data: Record<string, unknown>,
): WebMcpToolResponse {
  return {
    success: true,
    stateVersion: state.stateVersion,
    data,
  }
}

export function domainResponse(
  result: DomainResult,
  dataFactory: (state: DecisionRoomState) => Record<string, unknown>,
): WebMcpToolResponse {
  if (!result.success) {
    return failureResponse(result)
  }

  return successResponse(result.state, dataFactory(result.state))
}

export function failureResponse(failure: DomainFailure): WebMcpToolResponse {
  return {
    success: false,
    stateVersion: failure.state.stateVersion,
    error: failure.error,
    message: failure.message,
    retryable: failure.retryable,
  }
}

export function inputFailureResponse(
  state: DecisionRoomState,
  message: string,
): WebMcpToolResponse {
  return {
    success: false,
    stateVersion: state.stateVersion,
    error: "INVALID_INPUT",
    message,
    retryable: false,
  }
}
