import { useEffect, useSyncExternalStore } from "react"

import {
  getDecisionToolRegistryStatus,
  startDecisionToolRegistry,
  subscribeDecisionToolRegistry,
} from "@/src/webmcp/decision-tool-registry"

export function useDecisionWebMcp() {
  useEffect(() => startDecisionToolRegistry(), [])

  return useSyncExternalStore(
    subscribeDecisionToolRegistry,
    getDecisionToolRegistryStatus,
    getDecisionToolRegistryStatus,
  )
}
