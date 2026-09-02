import { useDecisionRoomStore } from "@/src/store/decision-room-store"
import { decisionTools, type DecisionToolName } from "./decision-tools"
import { getModelContext } from "./model-context"
import {
  queueRegistryReconciliation,
  resetRegistryCoherenceForTests,
  waitForDecisionToolRegistryCoherence,
} from "./registry-coherence"
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
const registrationControllers = new Map<DecisionToolName, AbortController>()

let storeUnsubscribe: (() => void) | null = null
let registryStarted = false
let lifecycleRevision = 0

export function startDecisionToolRegistry(): () => void {
  if (registryStarted) {
    return stopDecisionToolRegistry
  }

  registryStarted = true
  lifecycleRevision += 1
  const revision = lifecycleRevision

  requestReconciliation(revision)
  storeUnsubscribe = useDecisionRoomStore.subscribe(() => requestReconciliation(revision))

  return stopDecisionToolRegistry
}

export function stopDecisionToolRegistry(): void {
  storeUnsubscribe?.()
  storeUnsubscribe = null
  registryStarted = false
  lifecycleRevision += 1
  abortAllRegistrations()
  updateRegistryStatus({
    available: Boolean(getModelContext()),
    registeredTools: [],
    error: null,
  })
}

export function subscribeDecisionToolRegistry(subscriber: RegistrySubscriber): () => void {
  subscribers.add(subscriber)

  return () => subscribers.delete(subscriber)
}

export function getDecisionToolRegistryStatus(): RegistryStatus {
  return registryState
}

export { waitForDecisionToolRegistryCoherence }

export function resetDecisionToolRegistryForTests(): void {
  stopDecisionToolRegistry()
  resetRegistryCoherenceForTests()
  updateRegistryStatus({
    available: false,
    registeredTools: [],
    error: null,
  })
}

function requestReconciliation(revision: number): void {
  void queueRegistryReconciliation(async () => reconcileDecisionTools(revision))
}

async function reconcileDecisionTools(revision: number): Promise<void> {
  if (!registryStarted || revision !== lifecycleRevision) {
    return
  }

  const modelContext = getModelContext()

  if (!modelContext) {
    abortAllRegistrations()
    updateRegistryStatus({
      available: false,
      registeredTools: [],
      error: "Agent workspace tools are unavailable in this browser.",
    })
    return
  }

  const desiredToolNames = availableToolNames(useDecisionRoomStore.getState()).filter(isDecisionToolName)
  const desiredTools = new Set(desiredToolNames)

  for (const toolName of [...registrationControllers.keys()]) {
    if (!desiredTools.has(toolName)) {
      registrationControllers.get(toolName)?.abort()
      registrationControllers.delete(toolName)
    }
  }

  let registrationError: string | null = null

  for (const toolName of desiredToolNames) {
    if (registrationControllers.has(toolName)) {
      continue
    }

    const controller = new AbortController()
    registrationControllers.set(toolName, controller)

    try {
      await modelContext.registerTool(decisionTools[toolName], {
        signal: controller.signal,
      })
    } catch (error) {
      if (!controller.signal.aborted) {
        registrationControllers.delete(toolName)
        registrationError = error instanceof Error
          ? error.message
          : "WebMCP registration failed."
      }
    }

    if (!registryStarted || revision !== lifecycleRevision) {
      controller.abort()
      registrationControllers.delete(toolName)
      return
    }
  }

  updateRegistryStatus({
    available: true,
    registeredTools: desiredToolNames.filter((toolName) => registrationControllers.has(toolName)),
    error: registrationError,
  })
}

function abortAllRegistrations(): void {
  for (const controller of registrationControllers.values()) {
    controller.abort()
  }

  registrationControllers.clear()
}

function updateRegistryStatus(nextStatus: RegistryStatus): void {
  if (
    registryState.available === nextStatus.available &&
    registryState.error === nextStatus.error &&
    registryState.registeredTools.length === nextStatus.registeredTools.length &&
    registryState.registeredTools.every((toolName, index) => toolName === nextStatus.registeredTools[index])
  ) {
    return
  }

  registryState = nextStatus

  for (const subscriber of subscribers) {
    subscriber()
  }
}

function isDecisionToolName(value: string): value is DecisionToolName {
  return value in decisionTools
}
