import { useState, type ReactNode } from "react"
import {
  Activity,
  Banknote,
  Building2,
  GitBranch,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  formatCurrency,
  formatScheduleImpact,
  formatSignedCurrency,
  type Contract,
  type Issue,
  type ProjectImpactSimulation,
  type ResolutionOption,
  type ScheduleActivity,
} from "@/src/domain/decision"

type ImpactRipplePanelProps = {
  issue: Issue
  option: ResolutionOption | null
  simulation: ProjectImpactSimulation | null
  schedule: ScheduleActivity[]
  contracts: Contract[]
  currency: string
}

type RippleStep = {
  eyebrow: string
  title: string
  detail: string
  icon: ReactNode
}

export function ImpactRipplePanel({
  issue,
  option,
  simulation,
  schedule,
  contracts,
  currency,
}: ImpactRipplePanelProps) {
  const [replayCount, setReplayCount] = useState(0)

  if (!simulation || !option) {
    return null
  }

  const steps = buildRippleSteps(issue, option, simulation, schedule, contracts, currency)

  return (
    <Card className="overflow-hidden rounded-lg border-primary/25 bg-card py-4 shadow-sm">
      <CardHeader className="gap-2 px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity aria-hidden="true" className="size-4 text-primary" />
              <h2 className="text-base font-semibold">Change Ripple X-Ray</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              One route decision, traced through schedule, cost, and contract consequences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-md border-primary/25 bg-primary/5">
              {simulation.id}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => setReplayCount((count) => count + 1)}
            >
              <RotateCcw aria-hidden="true" />
              Replay ripple
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <ol
          key={`${simulation.fingerprint}:${replayCount}`}
          aria-label="Simulated change impact sequence"
          className="ripple-track grid gap-2 md:grid-cols-5"
        >
          {steps.map((step, index) => (
            <li
              key={`${step.eyebrow}:${step.title}`}
              className="ripple-step relative min-w-0 rounded-xl border border-border/70 bg-background/70 p-3"
              style={{ animationDelay: `${index * 140}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
                  {step.icon}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {step.eyebrow}
              </p>
              <h3 className="mt-1 text-sm font-semibold leading-snug">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-700/20 bg-emerald-600/8 px-3 py-2 text-xs">
          <span className="flex items-center gap-2 font-medium text-emerald-900">
            <ShieldCheck aria-hidden="true" className="size-4" />
            {simulation.mitigation ? "Agent mitigation included in calculated impact" : "No mitigation applied; base proposal impact retained"}
          </span>
          <span className="text-muted-foreground">
            Simulation only · approval remains human-controlled
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function buildRippleSteps(
  issue: Issue,
  option: ResolutionOption,
  simulation: ProjectImpactSimulation,
  schedule: ScheduleActivity[],
  contracts: Contract[],
  currency: string,
): RippleStep[] {
  const affectedActivities = issue.affectedActivityIds
    .map((id) => schedule.find((activity) => activity.id === id))
    .filter((activity): activity is ScheduleActivity => Boolean(activity))
  const firstActivity = affectedActivities[0]
  const milestone = affectedActivities.at(-1)
  const contract = contracts.find((candidate) =>
    issue.affectedContractIds.includes(candidate.id),
  )

  return [
    {
      eyebrow: "Geometry",
      title: geometryTitle(option),
      detail: geometryDetail(option),
      icon: <GitBranch aria-hidden="true" />,
    },
    {
      eyebrow: "Critical path",
      title: firstActivity ? `${firstActivity.id} shifts` : "Installation shifts",
      detail: `${formatScheduleImpact(option.scheduleImpactDays)} before mitigation.`,
      icon: <Activity aria-hidden="true" />,
    },
    {
      eyebrow: "Mitigation",
      title: simulation.mitigation?.label ?? "No mitigation applied",
      detail: simulation.mitigation
        ? `${simulation.mitigation.daysRecovered} day recovered for ${milestone?.id ?? "inspection"}.`
        : "The modeled schedule impact remains unchanged.",
      icon: <ShieldCheck aria-hidden="true" />,
    },
    {
      eyebrow: "Commercial",
      title: `${formatSignedCurrency(simulation.totalCostImpact, currency)} net change`,
      detail: `Forecast becomes ${formatCurrency(simulation.projectedBudget, currency)}.`,
      icon: <Banknote aria-hidden="true" />,
    },
    {
      eyebrow: "Contract",
      title: contract ? `${contract.id} affected` : "Package affected",
      detail: contract?.contractor ?? "Contract assignment unavailable.",
      icon: <Building2 aria-hidden="true" />,
    },
  ]
}

function geometryTitle(option: ResolutionOption): string {
  return `${option.id} r${option.revision} · ${option.strategy}`
}

function geometryDetail(option: ResolutionOption): string {
  if (option.constraintIds.length > 0) {
    return `Clears ${option.constraintIds.join(", ")} on ${option.routeOverlay?.drawingId ?? "the active drawing"}.`
  }

  return option.routeOverlay
    ? `Uses the agent-authored route on ${option.routeOverlay.drawingId}.`
    : "This alternative has no route geometry; its assumptions remain visible for review."
}
