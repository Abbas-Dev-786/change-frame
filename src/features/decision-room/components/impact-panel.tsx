import { Banknote, CalendarClock } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  formatCurrency,
  formatScheduleImpact,
  formatSignedCurrency,
  type ProjectImpactSimulation,
  type Project,
  type ResolutionOption,
} from "@/src/domain/decision"

type ImpactPanelProps = {
  project: Project
  selectedOption: ResolutionOption | null
  simulation: ProjectImpactSimulation | null
}

export function ImpactPanel({ project, selectedOption, simulation }: ImpactPanelProps) {
  const selectedCost = selectedOption?.costImpact ?? 0
  const totalCost = simulation?.totalCostImpact ?? selectedCost
  const projectedBudget = simulation?.projectedBudget ?? project.currentForecast + selectedCost

  return (
    <Card className="rounded-lg border-border/70 bg-card py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <CardTitle className="text-base">Project Impact</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 text-sm">
        <ImpactRow
          icon={<Banknote aria-hidden="true" />}
          label="Base budget"
          value={formatCurrency(project.budget)}
        />
        <ImpactRow
          icon={<Banknote aria-hidden="true" />}
          label={simulation ? "Final change" : "Selected change"}
          value={formatSignedCurrency(totalCost)}
        />
        {simulation?.mitigation ? (
          <ImpactRow
            icon={<Banknote aria-hidden="true" />}
            label="Mitigation cost"
            value={formatSignedCurrency(simulation.mitigation.additionalCost)}
          />
        ) : null}
        <ImpactRow
          icon={<Banknote aria-hidden="true" />}
          label="Base route change"
          value={formatSignedCurrency(selectedCost)}
        />
        <ImpactRow
          icon={<Banknote aria-hidden="true" />}
          label="Projected budget"
          value={formatCurrency(projectedBudget)}
        />
        <ImpactRow
          icon={<CalendarClock aria-hidden="true" />}
          label="Schedule"
          value={formatScheduleImpact(simulation?.finalScheduleImpactDays ?? selectedOption?.scheduleImpactDays ?? 0)}
        />
        <ImpactRow
          icon={<CalendarClock aria-hidden="true" />}
          label="Activity"
          value="MEP-342"
        />
      </CardContent>
    </Card>
  )
}

function ImpactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/55 px-3 py-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
