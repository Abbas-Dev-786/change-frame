import { History } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActivityEvent } from "@/src/domain/decision"

type ActivityTimelineProps = {
  events: ActivityEvent[]
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <Card className="rounded-lg border-border/70 bg-card py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <div className="flex items-center gap-2">
          <History aria-hidden="true" className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Decision Activity</h2>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 px-4">
        {events.map((event) => (
          <article key={event.id} className="grid gap-1 border-l-2 border-primary/25 pl-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">{event.label}</h3>
              <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-muted-foreground">{event.detail}</p>
          </article>
        ))}
      </CardContent>
    </Card>
  )
}
