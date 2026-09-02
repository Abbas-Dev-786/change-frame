import { ClipboardCheck, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  formatScheduleImpact,
  formatSignedCurrency,
  type ChangeOrder,
  type Contract,
  type Decision,
  type Project,
} from "@/src/domain/decision"

type ChangeOrderPanelProps = {
  project: Project
  contracts: Contract[]
  changeOrder: ChangeOrder | null
  decision: Decision | null
  canDraft: boolean
  onDraft: () => void
}

export function ChangeOrderPanel({
  project,
  contracts,
  changeOrder,
  decision,
  canDraft,
  onDraft,
}: ChangeOrderPanelProps) {
  const affectedContract = formatAffectedContract(contracts)

  if (!changeOrder) {
    return (
      <Card className="rounded-lg border-border/70 bg-card py-4 shadow-sm">
        <CardHeader className="gap-1 px-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Change Order Draft</CardTitle>
            <Badge variant="outline" className="rounded-md">
              CO-007
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4">
          <Empty className="min-h-52 border border-border/60 bg-background/55 p-6">
            <EmptyMedia variant="icon">
              <FileText aria-hidden="true" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No draft yet</EmptyTitle>
              <EmptyDescription>
                After DEC-019 is approved by the project manager, the workspace can generate the draft change order.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              disabled={!canDraft}
              onClick={onDraft}
            >
              <ClipboardCheck aria-hidden="true" />
              Draft change order
            </Button>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-lg border-primary/30 bg-card py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Change Order Draft</CardTitle>
          <Badge className="rounded-md bg-primary text-primary-foreground">
            {changeOrder.id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 text-sm">
        <section
          aria-label="Draft change order artifact"
          className="rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Draft document
              </p>
              <h2 className="text-lg font-semibold">{changeOrder.id}</h2>
            </div>
            <Badge variant="secondary" className="rounded-md capitalize">
              {changeOrder.status}
            </Badge>
          </div>

          <dl className="mt-4 grid gap-2">
            <ArtifactRow label="Project" value={project.name} />
            <ArtifactRow label="Decision source" value={changeOrder.decisionId} />
            <ArtifactRow label="Approved option" value={decision?.optionId ?? "Unavailable"} />
            <ArtifactRow label="Reason" value={changeOrder.reason} />
            <ArtifactRow label="Scope" value={changeOrder.scope} />
            <ArtifactRow label="Cost impact" value={formatSignedCurrency(changeOrder.costImpact)} />
            <ArtifactRow label="Schedule impact" value={formatScheduleImpact(changeOrder.scheduleImpactDays)} />
            <ArtifactRow label="Affected contract" value={affectedContract} />
          </dl>
        </section>
      </CardContent>
    </Card>
  )
}

function formatAffectedContract(contracts: Contract[]): string {
  const contract = contracts.find((candidate) => candidate.id === "MEP-04")

  if (!contract) {
    return "MEP-04"
  }

  return `${contract.id} — ${contract.contractor}`
}

function ArtifactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg bg-background/70 px-3 py-2 sm:grid-cols-[9rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
