import { PlugZap } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { RegistryStatus } from "@/src/webmcp/decision-tool-registry"

type WebMcpStatusPanelProps = {
  status: RegistryStatus
}

export function WebMcpStatusPanel({ status }: WebMcpStatusPanelProps) {
  return (
    <Alert className="rounded-lg border-border/70 bg-card">
      <PlugZap aria-hidden="true" className="size-4" />
      <AlertTitle>{status.available ? "Agent workspace connected" : "Agent workspace unavailable"}</AlertTitle>
      <AlertDescription className="mt-2 flex flex-wrap gap-2">
        {status.available ? (
          status.registeredTools.map((tool) => (
            <Badge key={tool} variant="outline" className="rounded-md bg-background/70">
              {tool}
            </Badge>
          ))
        ) : (
          <span>{status.error ?? "The project workspace remains available."}</span>
        )}
      </AlertDescription>
    </Alert>
  )
}
