export const PHASE_ZERO_TOOL_NAME = 'get_phase_zero_status'

type ToolExecutionOptions = {
  signal: AbortSignal
}

type ModelContextTool = {
  name: string
  title?: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: {
    readOnlyHint?: boolean
    untrustedContentHint?: boolean
  }
  execute: (
    input: Record<string, never>,
    options: ToolExecutionOptions,
  ) => Promise<unknown>
}

type ModelContext = {
  registerTool: (
    tool: ModelContextTool,
    options?: { signal?: AbortSignal },
  ) => Promise<void>
}

type WebMcpDocument = Document & {
  modelContext?: ModelContext
}

type OriginIsolatedWindow = Window & {
  originAgentCluster?: boolean
}

export type RegistrationStatus =
  | 'checking'
  | 'registered'
  | 'unsupported'
  | 'error'

export type PhaseZeroSnapshot = {
  status: RegistrationStatus
  secureContext: boolean
  originAgentCluster: boolean
  modelContextAvailable: boolean
  invocationCount: number
  lastInvokedAt: string | null
  error: string | null
}

const listeners = new Set<() => void>()

let registrationController: AbortController | null = null
let registrationTask: Promise<void> | null = null
let snapshot: PhaseZeroSnapshot = {
  status: 'checking',
  ...readEnvironment(),
  invocationCount: 0,
  lastInvokedAt: null,
  error: null,
}

function readEnvironment() {
  return {
    secureContext: window.isSecureContext === true,
    originAgentCluster:
      (window as OriginIsolatedWindow).originAgentCluster === true,
    modelContextAvailable: Boolean(
      (document as WebMcpDocument).modelContext?.registerTool,
    ),
  }
}

function createSnapshot(
  status: RegistrationStatus,
  overrides: Partial<PhaseZeroSnapshot> = {},
): PhaseZeroSnapshot {
  return {
    status,
    ...readEnvironment(),
    invocationCount: snapshot?.invocationCount ?? 0,
    lastInvokedAt: snapshot?.lastInvokedAt ?? null,
    error: null,
    ...overrides,
  }
}

function publish(nextSnapshot: PhaseZeroSnapshot) {
  snapshot = nextSnapshot
  listeners.forEach((listener) => listener())
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown registration error.'
}

function phaseZeroResult() {
  return {
    success: true,
    data: {
      application: 'ChangeDecision OS',
      phase: 'PHASE_0',
      status: 'ready',
      webMcpApi: 'imperative',
      secureContext: window.isSecureContext === true,
      originAgentCluster:
        (window as OriginIsolatedWindow).originAgentCluster === true,
      message: 'Phase 0 WebMCP registration and invocation succeeded.',
    },
  }
}

const phaseZeroTool: ModelContextTool = {
  name: PHASE_ZERO_TOOL_NAME,
  title: 'Get Phase Zero Status',
  description:
    'Verify that the ChangeDecision OS WebMCP compatibility spike is registered and callable. This read-only tool returns deployment and API diagnostics without changing application state.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
    untrustedContentHint: false,
  },
  execute: async (_input, { signal }) => {
    if (signal.aborted) {
      throw new DOMException('Tool execution was cancelled.', 'AbortError')
    }

    const invokedAt = new Date().toISOString()
    publish(
      createSnapshot('registered', {
        invocationCount: snapshot.invocationCount + 1,
        lastInvokedAt: invokedAt,
      }),
    )

    return phaseZeroResult()
  },
}

export function getPhaseZeroSnapshot() {
  return snapshot
}

export function subscribeToPhaseZero(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function ensurePhaseZeroToolRegistered() {
  const modelContext = (document as WebMcpDocument).modelContext

  if (!modelContext?.registerTool) {
    publish(createSnapshot('unsupported'))
    return
  }

  if (snapshot.status === 'registered' && !registrationController?.signal.aborted) {
    return
  }

  if (registrationTask) {
    return registrationTask
  }

  publish(createSnapshot('checking'))
  const controller = new AbortController()
  registrationController = controller

  const task = modelContext
    .registerTool(phaseZeroTool, { signal: controller.signal })
    .then(() => {
      if (registrationController === controller && !controller.signal.aborted) {
        publish(createSnapshot('registered'))
      }
    })
    .catch((error: unknown) => {
      if (controller.signal.aborted) {
        return
      }

      if (registrationController === controller) {
        registrationController = null
        publish(createSnapshot('error', { error: errorMessage(error) }))
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

export function unregisterPhaseZeroTool() {
  registrationController?.abort()
  registrationController = null
  registrationTask = null
  publish(createSnapshot('checking'))
}

export function resetPhaseZeroForTests() {
  unregisterPhaseZeroTool()
  listeners.clear()
  snapshot = createSnapshot('checking', {
    invocationCount: 0,
    lastInvokedAt: null,
  })
}

if (import.meta.hot) {
  import.meta.hot.dispose(unregisterPhaseZeroTool)
}
