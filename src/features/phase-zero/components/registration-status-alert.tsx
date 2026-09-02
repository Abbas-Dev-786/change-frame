import {
  CircleAlert,
  CircleCheck,
  CircleX,
  LoaderCircle,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { cn } from "@/lib/utils"

import type { RegistrationStatus } from "../model/phase-zero"

const statusCopy = {
  checking: {
    label: "Checking WebMCP",
    detail:
      "Looking for the imperative browser API and registering the spike tool.",
  },
  registered: {
    label: "Tool registered",
    detail:
      "The page is ready for a browser agent to discover the Phase 0 tool.",
  },
  unsupported: {
    label: "WebMCP unavailable",
    detail:
      "The human interface still works. Open the deployed site in ChatGPT’s in-app browser or Chrome 149+ with WebMCP enabled.",
  },
  error: {
    label: "Registration failed",
    detail:
      "The browser exposed WebMCP, but the temporary tool could not register.",
  },
} satisfies Record<RegistrationStatus, { label: string; detail: string }>

const statusClasses = {
  checking: "border-amber-700/25 bg-amber-50 text-amber-950",
  registered: "border-emerald-700/25 bg-emerald-50 text-emerald-950",
  unsupported: "border-orange-700/25 bg-orange-50 text-orange-950",
  error: "border-destructive/25 bg-destructive/5 text-destructive",
} satisfies Record<RegistrationStatus, string>

function StatusIcon({ status }: { status: RegistrationStatus }) {
  if (status === "registered") {
    return <CircleCheck aria-hidden="true" />
  }

  if (status === "unsupported") {
    return <CircleAlert aria-hidden="true" />
  }

  if (status === "error") {
    return <CircleX aria-hidden="true" />
  }

  return <LoaderCircle className="animate-spin" aria-hidden="true" />
}

type RegistrationStatusAlertProps = {
  status: RegistrationStatus
  error: string | null
}

export function RegistrationStatusAlert({
  status,
  error,
}: RegistrationStatusAlertProps) {
  const copy = statusCopy[status]

  return (
    <Alert
      className={cn("max-w-2xl bg-card/80 shadow-none", statusClasses[status])}
      aria-live="polite"
    >
      <StatusIcon status={status} />
      <AlertTitle>{copy.label}</AlertTitle>
      <AlertDescription className="text-current/70">
        <p>{copy.detail}</p>
        {error ? (
          <code className="mt-2 block font-mono text-xs text-current">
            {error}
          </code>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
