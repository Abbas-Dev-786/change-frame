import { useSyncExternalStore } from "react"

import {
  getFlightRecorderSnapshot,
  subscribeFlightRecorder,
} from "@/src/observability/agent-flight-recorder"

export function useAgentFlightRecorder() {
  return useSyncExternalStore(
    subscribeFlightRecorder,
    getFlightRecorderSnapshot,
    getFlightRecorderSnapshot,
  )
}
