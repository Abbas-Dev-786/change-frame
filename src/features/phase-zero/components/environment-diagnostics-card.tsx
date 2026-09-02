import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import type { EnvironmentDiagnostics } from "../model/phase-zero"

type EnvironmentDiagnosticsCardProps = {
  diagnostics: EnvironmentDiagnostics
}

export function EnvironmentDiagnosticsCard({
  diagnostics,
}: EnvironmentDiagnosticsCardProps) {
  const checks = [
    { label: "Secure context", passed: diagnostics.secureContext },
    { label: "Origin agent cluster", passed: diagnostics.originAgentCluster },
    { label: "modelContext API", passed: diagnostics.modelContextAvailable },
  ]

  return (
    <Card className="h-full rounded-none border-0 bg-transparent py-8 shadow-none ring-0 md:px-2">
      <CardHeader>
        <p className="text-xs font-extrabold tracking-[0.13em] text-orange-700 uppercase">
          01
        </p>
        <CardTitle className="text-2xl font-medium">Environment</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {checks.map((check, index) => (
            <li key={check.label}>
              {index > 0 ? <Separator /> : null}
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-muted-foreground">
                  {check.label}
                </span>
                <Badge
                  variant="outline"
                  className={
                    check.passed
                      ? "border-emerald-700/20 bg-emerald-50 text-emerald-800"
                      : "border-orange-700/20 bg-orange-50 text-orange-800"
                  }
                >
                  {check.passed ? "Yes" : "No"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
