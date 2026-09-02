import { CheckCircle2, GitBranch, WandSparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  formatScheduleImpact,
  formatSignedCurrency,
  type DecisionPhase,
  type OptionId,
  type ResolutionOption,
} from "@/src/domain/decision"

type OptionsPanelProps = {
  phase: DecisionPhase
  options: ResolutionOption[]
  selectedOptionId: OptionId | null
  previewOptionId: OptionId | null
  hasConstraint: boolean
  onPreview: (optionId: OptionId | null) => void
  onRevise: (optionId: OptionId) => void
  onSelect: (optionId: OptionId) => void
}

export function OptionsPanel({
  phase,
  options,
  selectedOptionId,
  previewOptionId,
  hasConstraint,
  onPreview,
  onRevise,
  onSelect,
}: OptionsPanelProps) {
  const selectionLocked = !["OPTIONS_AVAILABLE", "OPTION_SELECTED", "IMPACT_SIMULATED"].includes(phase)

  return (
    <section className="grid gap-3" aria-labelledby="resolution-options-title">
      <div className="flex items-center justify-between">
        <h2 id="resolution-options-title" className="text-base font-semibold">
          Resolution Options
        </h2>
        <Badge variant="outline" className="rounded-md">
          {options.length}/3
        </Badge>
      </div>

      {options.length === 0 ? (
        <Card className="rounded-lg border-dashed border-border/80 bg-card/70 py-4">
          <CardContent className="flex items-center gap-3 px-4 text-sm text-muted-foreground">
            <GitBranch aria-hidden="true" className="size-4" />
            No resolution options yet.
          </CardContent>
        </Card>
      ) : (
        options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            selected={option.id === selectedOptionId}
            previewed={option.id === previewOptionId}
            canSelect={!selectionLocked}
            canRevise={hasConstraint && option.id === "OPTION-A" && option.revision === 1}
            onPreview={onPreview}
            onRevise={onRevise}
            onSelect={onSelect}
          />
        ))
      )}
    </section>
  )
}

function OptionCard({
  option,
  selected,
  previewed,
  canSelect,
  canRevise,
  onPreview,
  onRevise,
  onSelect,
}: {
  option: ResolutionOption
  selected: boolean
  previewed: boolean
  canSelect: boolean
  canRevise: boolean
  onPreview: (optionId: OptionId | null) => void
  onRevise: (optionId: OptionId) => void
  onSelect: (optionId: OptionId) => void
}) {
  return (
    <Card
      tabIndex={0}
      className={`rounded-lg py-4 shadow-sm transition ${
        previewed ? "border-accent/60 bg-accent/10" : "border-border/70 bg-card"
      }`}
      onMouseEnter={() => onPreview(option.id)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(option.id)}
      onBlur={() => onPreview(null)}
    >
      <CardHeader className="gap-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold">
              {option.id} - {option.title}
            </CardTitle>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{option.description}</p>
          </div>
          <StatusBadge option={option} selected={selected} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 px-4">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Metric label="Cost" value={formatSignedCurrency(option.costImpact)} />
          <Metric label="Schedule" value={formatScheduleImpact(option.scheduleImpactDays)} />
          <Metric label="Risk" value={option.risk} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={selected ? "secondary" : "outline"}
            className="rounded-lg"
            disabled={!canSelect}
            onClick={() => onSelect(option.id)}
          >
            <CheckCircle2 aria-hidden="true" />
            {selected ? "Selected" : "Select"}
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-lg"
            disabled={!canRevise}
            onClick={() => onRevise(option.id)}
          >
            <WandSparkles aria-hidden="true" />
            Revise
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({
  option,
  selected,
}: {
  option: ResolutionOption
  selected: boolean
}) {
  if (selected) {
    return <Badge className="rounded-md">Selected</Badge>
  }

  if (option.status === "needs_revision") {
    return <Badge variant="outline" className="rounded-md border-orange-300 bg-orange-50 text-orange-800">Needs revision</Badge>
  }

  if (option.status === "revised") {
    return <Badge variant="outline" className="rounded-md border-emerald-300 bg-emerald-50 text-emerald-800">Revised</Badge>
  }

  return <Badge variant="secondary" className="rounded-md">Rev {option.revision}</Badge>
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/55 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium capitalize">{value}</div>
    </div>
  )
}
