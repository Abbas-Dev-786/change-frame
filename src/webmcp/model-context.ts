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
  title: string
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

export type ModelContext = {
  registerTool: (
    descriptor: WebMcpToolDescriptor,
    options?: { signal?: AbortSignal },
  ) => Promise<void>
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

  await nextAnimationFrame()
  await nextAnimationFrame()
}

function nextAnimationFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => resolve())
      return
    }

    window.setTimeout(resolve, 0)
  })
}
