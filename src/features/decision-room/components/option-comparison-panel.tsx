import { BarChart3, CircleCheckBig, GitCompareArrows } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatScheduleImpact,
  formatSignedCurrency,
  formatRejectionReason,
  type OptionId,
  type ResolutionOption,
  type RiskLevel,
} from "@/src/domain/decision"

type OptionComparisonPanelProps = {
  options: ResolutionOption[]
  selectedOptionId: OptionId | null
  currency: string
  onPreview: (optionId: OptionId | null) => void
}

type ComparisonRow = {
  option: ResolutionOption
  score: number
  fitLabel: string
  constraintLabel: string
  decisionNote: string
}

const riskWeights: Record<RiskLevel, number> = {
  low: 2,
  medium: 4,
  high: 10,
}

export function OptionComparisonPanel({
  options,
  selectedOptionId,
  currency,
  onPreview,
}: OptionComparisonPanelProps) {
  const rows = buildComparisonRows(options)
  const bestOptionId = selectedOptionId ?? rows[0]?.option.id ?? null

  return (
    <Card className="rounded-lg border-border/70 bg-card py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitCompareArrows aria-hidden="true" className="size-4 text-primary" />
            <h2 className="text-base font-semibold">Option Comparison</h2>
          </div>
          <Badge variant="outline" className="rounded-md">
            Decision fit
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        {rows.length === 0 ? (
          <Empty className="min-h-36 border border-border/60 bg-background/55 p-6">
            <EmptyMedia variant="icon">
              <BarChart3 aria-hidden="true" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Comparison pending</EmptyTitle>
              <EmptyDescription>
                Evaluate resolution options to compare cost, schedule, risk, and field-constraint fit.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table aria-label="Resolution option comparison">
            <TableHeader>
              <TableRow>
                <TableHead>Option</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Constraint</TableHead>
                <TableHead>Decision note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <ComparisonTableRow
                  key={row.option.id}
                  row={row}
                  highlighted={row.option.id === bestOptionId}
                  selected={row.option.id === selectedOptionId}
                  currency={currency}
                  onPreview={onPreview}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function ComparisonTableRow({
  row,
  highlighted,
  selected,
  currency,
  onPreview,
}: {
  row: ComparisonRow
  highlighted: boolean
  selected: boolean
  currency: string
  onPreview: (optionId: OptionId | null) => void
}) {
  return (
    <TableRow
      tabIndex={0}
      className={highlighted ? "bg-primary/5 hover:bg-primary/10" : undefined}
      onMouseEnter={() => onPreview(row.option.id)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(row.option.id)}
      onBlur={() => onPreview(null)}
    >
      <TableCell className="font-medium">
        <div className="flex flex-col gap-1">
          <span>{row.option.id}</span>
          <span className="text-xs font-normal text-muted-foreground">{row.option.title}</span>
          {highlighted ? (
            <Badge className="w-fit rounded-md">
              <CircleCheckBig aria-hidden="true" />
              {selected ? "Selected" : row.fitLabel}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>{formatSignedCurrency(row.option.costImpact, currency)}</TableCell>
      <TableCell>{formatScheduleImpact(row.option.scheduleImpactDays)}</TableCell>
      <TableCell className="capitalize">{row.option.risk}</TableCell>
      <TableCell>{row.constraintLabel}</TableCell>
      <TableCell className="min-w-56 whitespace-normal text-muted-foreground">
        {row.decisionNote}
      </TableCell>
    </TableRow>
  )
}

function buildComparisonRows(options: ResolutionOption[]): ComparisonRow[] {
  return [...options]
    .map((option) => ({
      option,
      score: scoreOption(option),
      fitLabel: getFitLabel(option),
      constraintLabel: getConstraintLabel(option),
      decisionNote: getDecisionNote(option),
    }))
    .sort((left, right) => left.score - right.score)
}

function scoreOption(option: ResolutionOption): number {
  const constraintPenalty = option.status === "needs_revision" ? 100 : 0
  const rejectionPenalty = option.status === "rejected" ? 1_000 : 0

  return (
    option.costImpact / 1000 +
    option.scheduleImpactDays * 2 +
    riskWeights[option.risk] +
    constraintPenalty +
    rejectionPenalty
  )
}

function getFitLabel(option: ResolutionOption): string {
  if (option.status === "rejected") {
    return "Rejected"
  }

  if (option.status === "needs_revision") {
    return "Needs coordination"
  }

  return "Best fit"
}

function getConstraintLabel(option: ResolutionOption): string {
  if (option.status === "rejected" && option.rejectionReason) {
    return formatRejectionReason(option.rejectionReason)
  }

  if (option.status === "needs_revision") {
    return "Blocked route"
  }

  if (option.constraintIds.length > 0) {
    return `Avoids ${option.constraintIds.join(", ")}`
  }

  return "No field block"
}

function getDecisionNote(option: ResolutionOption): string {
  if (option.status === "rejected" && option.rejectionReason) {
    return `Rejected by reviewer: ${formatRejectionReason(option.rejectionReason).toLowerCase()}.`
  }

  if (option.status === "needs_revision") {
    return "Requires route revision before it should be selected."
  }

  return option.rationale
}
