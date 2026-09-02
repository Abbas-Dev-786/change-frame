import { useEffect, useSyncExternalStore } from "react"

import {
  ensurePhaseZeroToolRegistered,
  getPhaseZeroSnapshot,
  subscribeToPhaseZero,
} from "../webmcp/phase-zero-registry"

export function usePhaseZero() {
  const snapshot = useSyncExternalStore(
    subscribeToPhaseZero,
    getPhaseZeroSnapshot,
    getPhaseZeroSnapshot,
  )

  useEffect(() => {
    void ensurePhaseZeroToolRegistered()
  }, [])

  return snapshot
}
