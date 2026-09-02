import type {
  PhaseZeroSnapshot,
  RegistrationStatus,
} from "../model/phase-zero"
import { getModelContext, readEnvironmentDiagnostics } from "./model-context"
import { createPhaseZeroTool } from "./phase-zero-tool"

type SnapshotListener = () => void

const listeners = new Set<SnapshotListener>()

let registrationController: AbortController | null = null
let registrationTask: Promise<void> | null = null
let snapshot: PhaseZeroSnapshot = {
  status: "checking",
  ...readEnvironmentDiagnostics(),
  invocationCount: 0,
  lastInvokedAt: null,
  error: null,
}

function createSnapshot(
  status: RegistrationStatus,
  overrides: Partial<PhaseZeroSnapshot> = {},
): PhaseZeroSnapshot {
  return {
    status,
    ...readEnvironmentDiagnostics(),
    invocationCount: snapshot.invocationCount,
    lastInvokedAt: snapshot.lastInvokedAt,
    error: null,
    ...overrides,
  }
}

function publish(nextSnapshot: PhaseZeroSnapshot): void {
  snapshot = nextSnapshot
  listeners.forEach((listener) => listener())
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown registration error."
}

function recordInvocation(invokedAt: string): void {
  publish(
    createSnapshot("registered", {
      invocationCount: snapshot.invocationCount + 1,
      lastInvokedAt: invokedAt,
    }),
  )
}

export function getPhaseZeroSnapshot(): PhaseZeroSnapshot {
  return snapshot
}

export function subscribeToPhaseZero(listener: SnapshotListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function ensurePhaseZeroToolRegistered(): Promise<void> {
  const modelContext = getModelContext()

  if (!modelContext?.registerTool) {
    publish(createSnapshot("unsupported"))
    return
  }

  if (
    snapshot.status === "registered" &&
    !registrationController?.signal.aborted
  ) {
    return
  }

  if (registrationTask) {
    return registrationTask
  }

  publish(createSnapshot("checking"))
  const controller = new AbortController()
  registrationController = controller

  const task = modelContext
    .registerTool(createPhaseZeroTool(recordInvocation), {
      signal: controller.signal,
    })
    .then(() => {
      if (
        registrationController === controller &&
        !controller.signal.aborted
      ) {
        publish(createSnapshot("registered"))
      }
    })
    .catch((error: unknown) => {
      if (controller.signal.aborted) {
        return
      }

      if (registrationController === controller) {
        registrationController = null
        publish(createSnapshot("error", { error: readErrorMessage(error) }))
      }
    })
    .finally(() => {
      if (registrationTask === task) {
        registrationTask = null
      }
    })

  registrationTask = task
  return task
}

export function unregisterPhaseZeroTool(): void {
  registrationController?.abort()
  registrationController = null
  registrationTask = null
  publish(createSnapshot("checking"))
}

export function resetPhaseZeroRegistryForTests(): void {
  unregisterPhaseZeroTool()
  listeners.clear()
  snapshot = {
    status: "checking",
    ...readEnvironmentDiagnostics(),
    invocationCount: 0,
    lastInvokedAt: null,
    error: null,
  }
}

if (import.meta.hot) {
  import.meta.hot.dispose(unregisterPhaseZeroTool)
}
