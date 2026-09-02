import type { EnvironmentDiagnostics } from "../model/phase-zero"

export type ToolExecutionOptions = {
  signal?: AbortSignal
}

export type ModelContextTool<TInput extends object, TResult> = {
  name: string
  title?: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: {
    readOnlyHint?: boolean
    untrustedContentHint?: boolean
  }
  execute: (input: TInput, options?: ToolExecutionOptions) => Promise<TResult>
}

export type ModelContext = {
  registerTool: <TInput extends object, TResult>(
    tool: ModelContextTool<TInput, TResult>,
    options?: { signal?: AbortSignal },
  ) => Promise<void>
}

type WebMcpDocument = Document & {
  modelContext?: ModelContext
}

type OriginIsolatedWindow = Window & {
  originAgentCluster?: boolean
}

export function getModelContext(): ModelContext | undefined {
  return (document as WebMcpDocument).modelContext
}

export function readEnvironmentDiagnostics(): EnvironmentDiagnostics {
  return {
    secureContext: window.isSecureContext === true,
    originAgentCluster:
      (window as OriginIsolatedWindow).originAgentCluster === true,
    modelContextAvailable: Boolean(getModelContext()?.registerTool),
  }
}
