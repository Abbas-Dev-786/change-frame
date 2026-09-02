import { useDecisionRoomStore } from "@/src/store/decision-room-store"
import { decisionTools, type DecisionToolName } from "./decision-tools"
import { disposeRegistration, getModelContext, type WebMcpRegistration } from "./model-context"
import { availableToolNames } from "./tool-data"

export type RegistryStatus = {
  available: boolean
  registeredTools: DecisionToolName[]
  error: string | null
}

type RegistrySubscriber = () => void

let registryState: RegistryStatus = {
  available: false,
  registeredTools: [],
  error: null,
}

const subscribers = new Set<RegistrySubscriber>()
const registrations = new Map<DecisionToolName, WebMcpRegistration | (() => void)>()

let storeUnsubscribe: (() => void) | null = null
let registryStarted = false
let webMcpRuntimeRefreshScheduled = false

export function startDecisionToolRegistry(): () => void {
  if (registryStarted) {
    return stopDecisionToolRegistry
  }

  registryStarted = true
  setRegistryStatus({
    ...registryState,
    available: Boolean(getModelContext()),
  })
  reconcileDecisionTools()
  storeUnsubscribe = useDecisionRoomStore.subscribe(() => reconcileDecisionTools())

  return stopDecisionToolRegistry
}

export function stopDecisionToolRegistry(): void {
  storeUnsubscribe?.()
  storeUnsubscribe = null
  registryStarted = false

  for (const registration of registrations.values()) {
    disposeRegistration(registration)
  }

  registrations.clear()
  setRegistryStatus({
    ...registryState,
    registeredTools: [],
  })
  notifySubscribers()
}

export function subscribeDecisionToolRegistry(subscriber: RegistrySubscriber): () => void {
  subscribers.add(subscriber)

  return () => subscribers.delete(subscriber)
}

export function getDecisionToolRegistryStatus(): RegistryStatus {
  return registryState
}

export function resetDecisionToolRegistryForTests(): void {
  stopDecisionToolRegistry()
  setRegistryStatus({
    available: false,
    registeredTools: [],
    error: null,
  })
}

function reconcileDecisionTools(): void {
  const modelContext = getModelContext()

  if (!modelContext) {
    clearRegistrations()
    setRegistryStatus({
      available: false,
      registeredTools: [],
      error: "Agent workspace tools are unavailable in this browser.",
    })
    notifySubscribers()
    return
  }

  const previousToolNames = [...registrations.keys()]
  const desiredToolNames = availableToolNames(useDecisionRoomStore.getState()).filter(isDecisionToolName)
  const desiredTools = new Set(desiredToolNames)

  for (const toolName of registrations.keys()) {
    if (!desiredTools.has(toolName)) {
      const registration = registrations.get(toolName)

      if (registration) {
        disposeRegistration(registration)
      }

      registrations.delete(toolName)
    }
  }

  for (const toolName of desiredTools) {
    if (!registrations.has(toolName)) {
      registerTool(modelContext, toolName)
    }
  }

  setRegistryStatus({
    available: true,
    registeredTools: [...registrations.keys()],
    error: null,
  })
  notifySubscribers()
  scheduleWebMcpRuntimeRefresh(previousToolNames, desiredToolNames)
}

function registerTool(modelContext: NonNullable<ReturnType<typeof getModelContext>>, toolName: DecisionToolName): void {
  try {
    const registration = modelContext.registerTool(decisionTools[toolName])

    if (isPromise(registration)) {
      registration
        .then((resolvedRegistration) => {
          registrations.set(toolName, resolvedRegistration)
          setRegistryStatus({
            ...registryState,
            registeredTools: [...registrations.keys()],
          })
          notifySubscribers()
        })
        .catch((error: unknown) => {
          setRegistryStatus({
            ...registryState,
            error: error instanceof Error ? error.message : "WebMCP registration failed.",
          })
          notifySubscribers()
        })
      return
    }

    registrations.set(toolName, registration)
  } catch (error) {
    setRegistryStatus({
      ...registryState,
      error: error instanceof Error ? error.message : "WebMCP registration failed.",
    })
  }
}

function clearRegistrations(): void {
  for (const registration of registrations.values()) {
    disposeRegistration(registration)
  }

  registrations.clear()
  setRegistryStatus({
    ...registryState,
    registeredTools: [],
  })
}

function notifySubscribers(): void {
  for (const subscriber of subscribers) {
    subscriber()
  }
}

function setRegistryStatus(nextStatus: RegistryStatus): void {
  if (
    registryState.available === nextStatus.available &&
    registryState.error === nextStatus.error &&
    registryState.registeredTools.length === nextStatus.registeredTools.length &&
    registryState.registeredTools.every((toolName, index) => toolName === nextStatus.registeredTools[index])
  ) {
    return
  }

  registryState = nextStatus
}

function scheduleWebMcpRuntimeRefresh(
  previousToolNames: DecisionToolName[],
  desiredToolNames: DecisionToolName[],
): void {
  if (
    previousToolNames.length === 0 ||
    toolNamesEqual(previousToolNames, desiredToolNames) ||
    webMcpRuntimeRefreshScheduled ||
    isTestRuntime()
  ) {
    return
  }

  webMcpRuntimeRefreshScheduled = true
  window.setTimeout(() => {
    window.location.reload()
  }, 100)
}

function toolNamesEqual(left: DecisionToolName[], right: DecisionToolName[]): boolean {
  return (
    left.length === right.length &&
    left.every((toolName, index) => toolName === right[index])
  )
}

function isTestRuntime(): boolean {
  return navigator.userAgent.toLowerCase().includes("jsdom")
}

function isDecisionToolName(value: string): value is DecisionToolName {
  return value in decisionTools
}

function isPromise<TValue>(value: TValue | Promise<TValue>): value is Promise<TValue> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "then" in value &&
      typeof value.then === "function",
  )
}
