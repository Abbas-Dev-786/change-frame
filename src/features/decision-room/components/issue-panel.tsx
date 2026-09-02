import { AlertTriangle, CalendarDays, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Contract, Issue, ScheduleActivity } from "@/src/domain/decision"

type IssuePanelProps = {
  issue: Issue
  schedule: ScheduleActivity[]
  contracts: Contract[]
}

export function IssuePanel({ issue, schedule, contracts }: IssuePanelProps) {
  const affectedActivity = schedule.find((activity) => activity.id === "MEP-342")
  const affectedContract = contracts.find((contract) => contract.id === "MEP-04")

  return (
    <Card className="rounded-lg border-border/70 bg-card py-4 shadow-sm">
      <CardHeader className="gap-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{issue.id}</h2>
            <p className="mt-1 text-sm font-medium leading-5">{issue.title}</p>
          </div>
          <Badge className="rounded-md bg-red-100 text-red-800 hover:bg-red-100">
            High
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 text-sm">
        <p className="text-muted-foreground">{issue.description}</p>
        <Separator />
        <Fact icon={<AlertTriangle aria-hidden="true" />} label="Exposure" value="3-6 days" />
        <Fact icon={<CalendarDays aria-hidden="true" />} label="Activity" value={affectedActivity?.id ?? "MEP-342"} />
        <Fact icon={<FileText aria-hidden="true" />} label="Contract" value={affectedContract?.id ?? "MEP-04"} />
      </CardContent>
    </Card>
  )
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <span className="min-w-20 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
