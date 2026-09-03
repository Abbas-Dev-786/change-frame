import { FileCheck2, ShieldCheck, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  formatScheduleImpact,
  formatSignedCurrency,
  type Decision,
  type DecisionPhase,
  type ProjectImpactSimulation,
} from "@/src/domain/decision"

type DecisionPanelProps = {
  phase: DecisionPhase
  simulation: ProjectImpactSimulation | null
  decision: Decision | null
  onSimulate: () => void
  onPrepare: () => void
  onApprove: () => void
}

export function DecisionPanel({
  phase,
  simulation,
  decision,
  onSimulate,
  onPrepare,
  onApprove,
}: DecisionPanelProps) {
  const canSimulate = phase === "OPTION_SELECTED"
  const canPrepare = phase === "IMPACT_SIMULATED"
  const canApprove = phase === "READY_FOR_APPROVAL" && Boolean(decision)

  return (
    <Card className="rounded-lg border-border/70 bg-card py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Decision Summary</h2>
          <Badge variant="outline" className="rounded-md">
            {decision?.id ?? "Not prepared"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 text-sm">
        <SummaryRow label="Selected resolution" value={decision?.optionId ?? "Waiting for selection"} />
        <SummaryRow
          label="Cost impact"
          value={simulation ? formatSignedCurrency(simulation.totalCostImpact) : "Not simulated"}
        />
        <SummaryRow
          label="Schedule impact"
          value={simulation ? formatScheduleImpact(simulation.finalScheduleImpactDays) : "Not simulated"}
        />
        <SummaryRow
          label="Mitigation"
          value={simulation?.mitigation?.label ?? "Not applied"}
        />
        <SummaryRow
          label="Status"
          value={decision?.status ?? (phase === "APPROVED" ? "APPROVED" : "Drafting not started")}
        />

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" size="sm" className="rounded-lg" disabled={!canSimulate} onClick={onSimulate}>
            <Sparkles aria-hidden="true" />
            Simulate impact
          </Button>
          <Button type="button" size="sm" variant="outline" className="rounded-lg" disabled={!canPrepare} onClick={onPrepare}>
            <FileCheck2 aria-hidden="true" />
            Prepare decision
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="rounded-lg border border-primary/20"
            disabled={!canApprove}
            onClick={onApprove}
          >
            <ShieldCheck aria-hidden="true" />
            Approve decision
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/55 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
