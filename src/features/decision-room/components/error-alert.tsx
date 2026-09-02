import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ToolErrorCode } from "@/src/domain/decision"

type ErrorAlertProps = {
  error: ToolErrorCode | null
}

const errorMessages: Record<ToolErrorCode, string> = {
  INVALID_STATE: "That action is not valid for the current phase.",
  OPTION_NOT_FOUND: "The requested option is not available in the current decision state.",
  CONSTRAINT_NOT_FOUND: "Create or read CONSTRAINT-12 before revising an option.",
  OPTION_NOT_SELECTED: "A human-selected option is required before impact simulation.",
  SIMULATION_REQUIRED: "Run impact simulation before preparing the decision.",
  HUMAN_APPROVAL_REQUIRED: "Human approval is required before a change order can be drafted.",
  STATE_CONFLICT: "The decision changed. Reread context and retry with the current state version.",
  OPTION_REVISION_CONFLICT: "The option revision changed. Reread the option before retrying.",
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  if (!error) {
    return null
  }

  return (
    <Alert variant="destructive" className="border-destructive/40">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>Last workflow guardrail</AlertTitle>
      <AlertDescription>{errorMessages[error]}</AlertDescription>
    </Alert>
  )
}
