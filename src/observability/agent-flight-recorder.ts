import type { DomainResult } from "@/src/domain/decision"
import type { DecisionToolName } from "@/src/webmcp/decision-tools"
import type { WebMcpToolResponse } from "@/src/webmcp/responses"

export type FlightActor = "agent" | "human" | "system"
export type FlightStatus = "running" | "success" | "error"

export type FlightEvent = {
  id: string
  actor: FlightActor
  action: string
  detail: string
  status: FlightStatus
  stateVersionBefore: number
  stateVersionAfter: number
  expectedStateVersion: number | null
  durationMs: number | null
  errorCode: string | null
  createdAt: string
}

export type FlightRecorderSnapshot = {
  events: FlightEvent[]
}

type FlightSubscriber = () => void

const MAX_EVENTS = 40
const subscribers = new Set<FlightSubscriber>()

let eventSequence = 0
let recorderState: FlightRecorderSnapshot = { events: [] }

export function subscribeFlightRecorder(subscriber: FlightSubscriber): () => void {
  subscribers.add(subscriber)

  return () => subscribers.delete(subscriber)
}

export function getFlightRecorderSnapshot(): FlightRecorderSnapshot {
  return recorderState
}

export async function observeDecisionToolExecution(
  toolName: DecisionToolName,
  input: unknown,
  stateVersionBefore: number,
  execute: () => WebMcpToolResponse | Promise<WebMcpToolResponse>,
): Promise<WebMcpToolResponse> {
  const startedAt = monotonicNow()
  const eventId = appendEvent({
    actor: "agent",
    action: toolName,
    detail: "WebMCP call in progress.",
    status: "running",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore,
    expectedStateVersion: readExpectedStateVersion(input),
    durationMs: null,
    errorCode: null,
  })

  try {
    const response = await execute()

    updateEvent(eventId, {
      detail: response.success
        ? response.stateVersion === stateVersionBefore
          ? "Completed without mutating shared state."
          : "Completed and synchronized the shared workspace."
        : response.message,
      status: response.success ? "success" : "error",
      stateVersionAfter: response.stateVersion,
      durationMs: elapsedMilliseconds(startedAt),
      errorCode: response.success ? null : response.error,
    })

    return response
  } catch (error) {
    updateEvent(eventId, {
      detail: error instanceof Error ? error.message : "The WebMCP call failed unexpectedly.",
      status: "error",
      durationMs: elapsedMilliseconds(startedAt),
      errorCode: "UNHANDLED_EXCEPTION",
    })
    throw error
  }
}

export function recordHumanDecisionAction(
  action: string,
  label: string,
  stateVersionBefore: number,
  result: DomainResult,
): void {
  appendEvent({
    actor: "human",
    action,
    detail: result.success ? label : result.message,
    status: result.success ? "success" : "error",
    stateVersionBefore,
    stateVersionAfter: result.state.stateVersion,
    expectedStateVersion: null,
    durationMs: null,
    errorCode: result.success ? null : result.error,
  })
}

export function recordHumanWorkflowReset(
  stateVersionBefore: number,
  stateVersionAfter: number,
): void {
  clearFlightRecorder()
  appendEvent({
    actor: "human",
    action: "reset_workflow",
    detail: "Reset the decision room while preserving a monotonic state version.",
    status: "success",
    stateVersionBefore,
    stateVersionAfter,
    expectedStateVersion: null,
    durationMs: null,
    errorCode: null,
  })
}

export function recordCapabilityReconciliation(input: {
  available: boolean
  registeredTools: string[]
  previousTools: string[]
  stateVersion: number
  error: string | null
}): void {
  if (!input.available && !input.error) {
    return
  }

  appendEvent({
    actor: "system",
    action: "reconcile_capabilities",
    detail: input.error
      ? input.error
      : describeCapabilityChange(input.previousTools, input.registeredTools),
    status: input.error ? "error" : "success",
    stateVersionBefore: input.stateVersion,
    stateVersionAfter: input.stateVersion,
    expectedStateVersion: null,
    durationMs: null,
    errorCode: input.error ? "REGISTRY_ERROR" : null,
  })
}

export function resetFlightRecorderForTests(): void {
  clearFlightRecorder()
}

function appendEvent(
  event: Omit<FlightEvent, "id" | "createdAt">,
): string {
  eventSequence += 1
  const id = `FLIGHT-${String(eventSequence).padStart(4, "0")}`
  const nextEvent: FlightEvent = {
    ...event,
    id,
    createdAt: new Date().toISOString(),
  }

  recorderState = {
    events: [...recorderState.events, nextEvent].slice(-MAX_EVENTS),
  }
  emitChange()

  return id
}

function updateEvent(
  eventId: string,
  update: Partial<Pick<
    FlightEvent,
    "detail" | "status" | "stateVersionAfter" | "durationMs" | "errorCode"
  >>,
): void {
  recorderState = {
    events: recorderState.events.map((event) =>
      event.id === eventId ? { ...event, ...update } : event,
    ),
  }
  emitChange()
}

function clearFlightRecorder(): void {
  recorderState = { events: [] }
  emitChange()
}

function emitChange(): void {
  for (const subscriber of subscribers) {
    subscriber()
  }
}

function monotonicNow(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now()
}

function elapsedMilliseconds(startedAt: number): number {
  return Math.max(0, Math.round(monotonicNow() - startedAt))
}

function readExpectedStateVersion(input: unknown): number | null {
  if (typeof input !== "object" || input === null || !("expectedStateVersion" in input)) {
    return null
  }

  const value = input.expectedStateVersion

  return typeof value === "number" && Number.isInteger(value) ? value : null
}

function describeCapabilityChange(previousTools: string[], registeredTools: string[]): string {
  const activated = registeredTools.filter((tool) => !previousTools.includes(tool))
  const withdrawn = previousTools.filter((tool) => !registeredTools.includes(tool))
  const changes = [
    activated.length > 0 ? `Activated ${activated.join(", ")}.` : "",
    withdrawn.length > 0 ? `Withdrew ${withdrawn.join(", ")}.` : "",
  ].filter(Boolean)

  return changes.join(" ") || `${registeredTools.length} capabilities remain synchronized.`
}
