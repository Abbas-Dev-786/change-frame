import { Braces, Clock3, RadioTower } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { PHASE_ZERO_TOOL_NAME } from "../model/phase-zero"

type ToolRegistrationCardProps = {
  invocationCount: number
  lastInvokedAt: string | null
}

function formatInvocationTime(lastInvokedAt: string | null): string {
  return lastInvokedAt
    ? new Date(lastInvokedAt).toLocaleTimeString()
    : "Not yet"
}

export function ToolRegistrationCard({
  invocationCount,
  lastInvokedAt,
}: ToolRegistrationCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 bg-foreground text-background shadow-2xl shadow-foreground/15 ring-0">
      <div
        className="pointer-events-none absolute -right-20 -bottom-28 size-60 rounded-full border border-background/15"
        aria-hidden="true"
      />
      <CardHeader className="relative gap-10">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[0.7rem] font-bold tracking-[0.08em] text-background/65 uppercase">
            <RadioTower className="size-3.5" aria-hidden="true" />
            Registered capability
          </span>
          <Badge className="bg-background/10 text-background ring-1 ring-background/15 hover:bg-background/10">
            Read only
          </Badge>
        </div>
        <div className="space-y-3">
          <CardTitle className="font-mono text-xl font-semibold text-amber-300 sm:text-2xl">
            {PHASE_ZERO_TOOL_NAME}
          </CardTitle>
          <CardDescription className="max-w-md text-sm leading-6 text-background/70">
            Returns a compact success payload with the application name, spike
            phase, API mode, and deployment diagnostics.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative grid grid-cols-2 gap-4">
        <Separator className="col-span-2 bg-background/15" />
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[0.68rem] tracking-[0.06em] text-background/55 uppercase">
            <Braces className="size-3.5" aria-hidden="true" />
            Invocations
          </span>
          <p className="text-base font-semibold">{invocationCount}</p>
        </div>
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[0.68rem] tracking-[0.06em] text-background/55 uppercase">
            <Clock3 className="size-3.5" aria-hidden="true" />
            Last invoked
          </span>
          <p className="text-base font-semibold">
            {formatInvocationTime(lastInvokedAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
