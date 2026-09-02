import type { WebMcpToolResponse } from "./responses"

export type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type JsonSchema = {
  type?: string
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  enum?: readonly JsonValue[]
  required?: readonly string[]
  minimum?: number
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  additionalProperties?: boolean
}

export type ToolExecutionOptions = {
  signal?: AbortSignal
}

export type WebMcpToolDescriptor = {
  name: string
  description: string
  inputSchema: JsonSchema
  annotations: {
    readOnlyHint: boolean
    untrustedContentHint?: boolean
  }
  execute: (
    input: unknown,
    options?: ToolExecutionOptions,
  ) => WebMcpToolResponse | Promise<WebMcpToolResponse>
}

export type WebMcpRegistration = {
  remove?: () => void
  unregister?: () => void
}

export type ModelContext = {
  registerTool: (
    descriptor: WebMcpToolDescriptor,
  ) => WebMcpRegistration | (() => void) | Promise<WebMcpRegistration | (() => void)>
}

declare global {
  interface Document {
    modelContext?: ModelContext
  }
}

export function getModelContext(): ModelContext | null {
  return document.modelContext ?? null
}

export function isAbortError(options?: ToolExecutionOptions): boolean {
  return Boolean(options?.signal?.aborted)
}

export async function waitForUiCoherence(options?: ToolExecutionOptions): Promise<void> {
  if (isAbortError(options)) {
    return
  }

  await new Promise<void>((resolve) => {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => resolve())
      return
    }

    window.setTimeout(resolve, 0)
  })
}

export function disposeRegistration(registration: WebMcpRegistration | (() => void)): void {
  if (typeof registration === "function") {
    registration()
    return
  }

  if (typeof registration.remove === "function") {
    registration.remove()
    return
  }

  registration.unregister?.()
}
