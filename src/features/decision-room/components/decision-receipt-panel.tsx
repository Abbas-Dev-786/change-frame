import { FileClock, Fingerprint, UserRoundCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  formatScheduleImpact,
  formatSignedCurrency,
  type ChangeOrder,
  type Constraint,
  type Decision,
  type ProjectImpactSimulation,
  type ResolutionOption,
} from "@/src/domain/decision"
import { useAgentFlightRecorder } from "../hooks/use-agent-flight-recorder"

type DecisionReceiptPanelProps = {
  decision: Decision | null
  option: ResolutionOption | null
  constraint: Constraint | null
  simulation: ProjectImpactSimulation | null
  changeOrder: ChangeOrder | null
}

export function DecisionReceiptPanel({
  decision,
  option,
  constraint,
  simulation,
  changeOrder,
}: DecisionReceiptPanelProps) {
  const recorder = useAgentFlightRecorder()

  if (!decision || !option || !simulation) {
    return null
  }

  const trace = [
    decision.id,
    `${option.id}.r${decision.optionRevision}`,
    constraint?.id ?? "NO-CONSTRAINT",
    `v${decision.sourceStateVersion}`,
  ].join(" / ")
  const isApproved = decision.status === "APPROVED"
  const agentEvents = recorder.events.filter((event) => event.actor === "agent")
  const latestAgentEvent = agentEvents.at(-1)

  return (
    <Card className="rounded-lg border-primary/25 bg-card py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Fingerprint aria-hidden="true" className="size-4 text-primary" />
            <h2 className="text-base font-semibold">Decision Receipt</h2>
          </div>
          <Badge
            variant={isApproved ? "default" : "outline"}
            className="rounded-md"
          >
            {isApproved ? "Human approved" : "Awaiting human approval"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 text-sm">
        <div className="rounded-xl border border-border/70 bg-background/70 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Reproducible state trace
          </p>
          <code className="mt-1 block break-words text-xs font-semibold text-primary">{trace}</code>
          <a
            href="#agent-flight-recorder"
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
          >
            Flight provenance · {agentEvents.length} agent calls · {latestAgentEvent?.id ?? "human-only session"}
          </a>

          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <ReceiptFact label="Geometry input" value={constraint ? `${constraint.id}: ${constraint.label}` : "No field constraint"} />
            <ReceiptFact label="Resolution input" value={`${option.strategy} · revision ${decision.optionRevision}`} />
            <ReceiptFact label="Cost result" value={formatSignedCurrency(decision.costImpact)} />
            <ReceiptFact label="Schedule result" value={formatScheduleImpact(decision.scheduleImpactDays)} />
            <ReceiptFact label="Simulation" value={simulation.id} />
            <ReceiptFact label="Artifact" value={changeOrder ? `${changeOrder.id} · draft` : "Not drafted"} />
          </dl>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-lg border border-border/60 px-3 py-2">
            <UserRoundCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Approval boundary</p>
              <p className="text-xs text-muted-foreground">
                {decision.approvedAt ? (
                  <>Approved by a human at <time dateTime={decision.approvedAt}>{formatTimestamp(decision.approvedAt)}</time>.</>
                ) : "Only a human can approve this prepared decision."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-border/60 px-3 py-2">
            <FileClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Execution boundary</p>
              <p className="text-xs text-muted-foreground">
                {changeOrder ? "CO-007 is a draft only; no contract was executed." : "No contract artifact has been executed."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReceiptFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/55 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
