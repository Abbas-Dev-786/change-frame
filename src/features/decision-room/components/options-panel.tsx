import { useState } from "react"
import { CheckCircle2, GitBranch, WandSparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  formatRejectionReason,
  formatScheduleImpact,
  formatSignedCurrency,
  isOptionEligibleForSelection,
  type DecisionPhase,
  type OptionId,
  type OptionRejectionReason,
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
  onReject: (optionId: OptionId, reason: OptionRejectionReason) => void
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
  onReject,
  onSelect,
}: OptionsPanelProps) {
  const selectionLocked = !["OPTIONS_AVAILABLE", "OPTION_SELECTED", "IMPACT_SIMULATED"].includes(phase)
  const rejectionLocked = !["OPTIONS_AVAILABLE", "OPTION_SELECTED", "IMPACT_SIMULATED"].includes(phase)

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
            canSelect={!selectionLocked && isOptionEligibleForSelection(option)}
            canRevise={hasConstraint && option.strategy === "reroute" && option.status === "needs_revision"}
            canReject={!rejectionLocked}
            onPreview={onPreview}
            onRevise={onRevise}
            onReject={onReject}
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
  canReject,
  onPreview,
  onRevise,
  onReject,
  onSelect,
}: {
  option: ResolutionOption
  selected: boolean
  previewed: boolean
  canSelect: boolean
  canRevise: boolean
  canReject: boolean
  onPreview: (optionId: OptionId | null) => void
  onRevise: (optionId: OptionId) => void
  onReject: (optionId: OptionId, reason: OptionRejectionReason) => void
  onSelect: (optionId: OptionId) => void
}) {
  const [rejectionReason, setRejectionReason] = useState<OptionRejectionReason>(
    option.rejectionReason ?? "too_risky",
  )

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
            <h3 className="text-sm font-semibold">
              {option.id} - {option.title}
            </h3>
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
          <NativeSelect
            size="sm"
            aria-label={`Rejection reason for ${option.id}`}
            value={rejectionReason}
            disabled={!canReject}
            onChange={(event) => setRejectionReason(readRejectionReason(event.currentTarget.value))}
          >
            {rejectionReasonOptions.map((reason) => (
              <NativeSelectOption key={reason} value={reason}>
                {formatRejectionReason(reason)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg"
            disabled={!canReject}
            onClick={() => onReject(option.id, rejectionReason)}
          >
            {option.status === "rejected" ? "Update reason" : "Reject option"}
          </Button>
        </div>
        {option.rejectionReason ? (
          <p className="text-sm text-muted-foreground">
            Rejection reason: {formatRejectionReason(option.rejectionReason)}
          </p>
        ) : null}
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

  if (option.status === "rejected") {
    return <Badge variant="outline" className="rounded-md border-red-300 bg-red-50 text-red-800">Rejected</Badge>
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

const rejectionReasonOptions = [
  "too_risky",
  "too_expensive",
  "schedule_exposure",
  "violates_field_constraint",
  "requires_engineering_review",
] as const

function readRejectionReason(value: string): OptionRejectionReason {
  const matchingReason = rejectionReasonOptions.find((reason) => reason === value)

  return matchingReason ?? "too_risky"
}
