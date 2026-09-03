import { useState, type CSSProperties } from "react"
import {
  ArrowUpRight,
  Bot,
  Check,
  CircleDot,
  LockKeyhole,
  Play,
  Radio,
  ShieldCheck,
  UserRoundCheck,
  Workflow,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import type { DecisionPhase } from "@/src/domain/decision"
import type { FlightActor, FlightEvent } from "@/src/observability/agent-flight-recorder"
import type { DecisionToolName } from "@/src/webmcp/decision-tools"
import type { RegistryStatus } from "@/src/webmcp/decision-tool-registry"
import { useAgentFlightRecorder } from "../hooks/use-agent-flight-recorder"

type WebMcpStatusPanelProps = {
  status: RegistryStatus
  phase: DecisionPhase
  stateVersion: number
  hasConstraint: boolean
  hasSelection: boolean
  isApproved: boolean
}

type ToolCapability = {
  name: DecisionToolName
  label: string
  mode: "read" | "act"
}

type DrawerStyle = CSSProperties & {
  "--drawer-content-height"?: string
  "--drawer-content-width"?: string
}

const TOOL_CAPABILITIES: ToolCapability[] = [
  { name: "get_decision_context", label: "Read context", mode: "read" },
  { name: "get_user_constraints", label: "Read constraints", mode: "read" },
  { name: "configure_decision_context", label: "Build context", mode: "act" },
  { name: "evaluate_resolution_options", label: "Author options", mode: "act" },
  { name: "revise_resolution_option", label: "Author revision", mode: "act" },
  { name: "simulate_project_impact", label: "Calculate impact", mode: "act" },
  { name: "prepare_change_decision", label: "Prepare decision", mode: "act" },
  { name: "draft_change_order", label: "Draft change order", mode: "act" },
]

export function WebMcpStatusPanel({
  status,
  phase,
  stateVersion,
  hasConstraint,
  hasSelection,
  isApproved,
}: WebMcpStatusPanelProps) {
  const recorder = useAgentFlightRecorder()
  const isMobile = useIsMobile()
  const [replayCount, setReplayCount] = useState(0)
  const recentEvents = recorder.events.slice(-6).reverse()
  const latestEvent = recorder.events.at(-1) ?? null
  const drawerStyle: DrawerStyle = isMobile
    ? {
        "--drawer-content-height": "min(90dvh, 52rem)",
        "--drawer-content-width": "auto",
      }
    : {
        "--drawer-content-width": "min(42rem, calc(100vw - 2rem))",
      }
  const successfulAgentTools = new Set(
    recorder.events
      .filter((event) => event.actor === "agent" && event.status === "success")
      .map((event) => event.action),
  )

  return (
    <Drawer
      swipeDirection={isMobile ? "down" : "right"}
      showSwipeHandle={isMobile}
    >
      <Card
        id="agent-flight-recorder"
        className="overflow-hidden rounded-lg border-primary/25 bg-card py-0 shadow-sm"
      >
        <DrawerTrigger
          render={
            <button
              type="button"
              aria-label="Open Agent Flight Recorder"
              className="group w-full cursor-pointer px-4 py-4 text-left outline-none transition-colors hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Workflow aria-hidden="true" className="size-4 shrink-0 text-primary" />
                <span role="heading" aria-level={2} className="text-base font-semibold">
                  Agent Flight Recorder
                </span>
                <span
                  key={`${status.available}:${status.registeredTools.join(":")}`}
                  className={`size-2 shrink-0 rounded-full ${status.available ? "bg-emerald-600 flight-recorder-pulse" : "bg-destructive"}`}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextMoveLabel(phase, status)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-md bg-background/70">
                {status.registeredTools.length} of {TOOL_CAPABILITIES.length} tools live
              </Badge>
              <span className="grid size-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0 rounded-md border border-border/65 bg-background/60 px-3 py-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Latest event
              </span>
              {latestEvent ? (
                <div className="mt-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-mono font-semibold">{latestEvent.action}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    v{latestEvent.stateVersionBefore} → v{latestEvent.stateVersionAfter}
                  </span>
                </div>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">Waiting for the first action</p>
              )}
            </div>
            <span
              aria-label="Human authority: protected"
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"
            >
              <ShieldCheck aria-hidden="true" className="size-4" />
              <code className="normal-case tracking-normal">approve_decision</code>
              · human only
            </span>
          </div>
        </DrawerTrigger>
      </Card>

      <DrawerContent style={drawerStyle}>
        <DrawerHeader className="border-b border-border/65 px-4 pb-4 text-left sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Workflow aria-hidden="true" className="size-4 text-primary" />
                <DrawerTitle>Agent Flight Recorder</DrawerTitle>
                <span
                  className={`size-2 rounded-full ${status.available ? "bg-emerald-600 flight-recorder-pulse" : "bg-destructive"}`}
                  aria-hidden="true"
                />
              </div>
              <DrawerDescription className="mt-1 text-left">
                Live capability choreography and actor-attributed state trace.
              </DrawerDescription>
            </div>
            <DrawerClose
              render={<Button type="button" size="icon-sm" variant="ghost" className="shrink-0 rounded-lg" />}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Close flight recorder</span>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline" className="rounded-md bg-background/70">
                {status.registeredTools.length} of {TOOL_CAPABILITIES.length} tools live
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={recorder.events.length === 0}
                onClick={() => setReplayCount((count) => count + 1)}
              >
                <Play aria-hidden="true" />
                Replay trace
              </Button>
            </div>

            <div
              key={`capabilities:${replayCount}`}
              aria-label="WebMCP capability constellation"
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {TOOL_CAPABILITIES.map((tool, index) => {
                const isLive = status.registeredTools.includes(tool.name)
                const wasUsed = successfulAgentTools.has(tool.name)
                const state = isLive ? "live" : wasUsed ? "used" : "locked"

                return (
                  <div
                    key={tool.name}
                    aria-label={`${tool.label}: ${state}`}
                    title={isLive ? "Registered and available to the browser agent now." : wasUsed ? "Successfully used earlier in this session." : "Not valid in the current decision state."}
                    className={capabilityClassName(state)}
                    style={{ animationDelay: `${index * 65}ms` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="grid size-7 place-items-center rounded-md bg-background/80">
                        {state === "live" ? (
                          <Radio aria-hidden="true" className="size-3.5" />
                        ) : state === "used" ? (
                          <Check aria-hidden="true" className="size-3.5" />
                        ) : (
                          <LockKeyhole aria-hidden="true" className="size-3.5" />
                        )}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                        {state}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold">{tool.label}</p>
                    <code className="mt-1 block break-all text-[9px] leading-relaxed opacity-70">
                      {tool.name}
                    </code>
                    <span className="mt-2 block text-[9px] uppercase tracking-[0.14em] opacity-65">
                      {tool.mode === "read" ? "Read only" : "State action"}
                    </span>
                  </div>
                )
              })}
              <div className="flight-capability-node col-span-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-2.5 sm:col-span-1">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">Protected</span>
                </div>
                <p className="mt-2 text-xs font-semibold">Human authority</p>
                <code className="mt-1 block text-[9px] opacity-70">approve_decision</code>
                <span className="mt-2 block text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  Never a tool
                </span>
              </div>
            </div>

            <section aria-label="Human checkpoints" className="grid grid-cols-3 gap-2">
              <HumanCheckpoint label="Field constraint" passed={hasConstraint} />
              <HumanCheckpoint label="Option selection" passed={hasSelection} />
              <HumanCheckpoint label="Final approval" passed={isApproved} />
            </section>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 font-medium">
                <CircleDot aria-hidden="true" className="size-4 text-primary" />
                Next valid move
              </span>
              <span className="text-right text-muted-foreground">
                {nextMoveLabel(phase, status)} · shared state v{stateVersion}
              </span>
            </div>

            <section aria-labelledby="flight-trace-title">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 id="flight-trace-title" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Latest trace
                </h3>
                <span className="text-[10px] text-muted-foreground">Session-only · inputs redacted</span>
              </div>
              <div key={`trace:${replayCount}`} aria-live="polite" className="grid gap-2">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event, index) => (
                    <TraceRow key={event.id} event={event} index={index} />
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-background/55 px-3 py-4 text-center text-xs text-muted-foreground">
                    The first human action or WebMCP call will appear here.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function HumanCheckpoint({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className={`rounded-lg border px-2 py-2 text-center ${passed ? "border-primary/25 bg-primary/7" : "border-border/65 bg-background/55"}`}>
      <UserRoundCheck aria-hidden="true" className={`mx-auto size-4 ${passed ? "text-primary" : "text-muted-foreground"}`} />
      <p className="mt-1 text-[10px] font-medium leading-tight">{label}</p>
      <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        {passed ? "Passed" : "Human only"}
      </span>
    </div>
  )
}

function TraceRow({ event, index }: { event: FlightEvent; index: number }) {
  return (
    <div
      className="flight-trace-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border/65 bg-background/65 px-3 py-2"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <ActorBadge actor={event.actor} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <code className="truncate text-[10px] font-semibold">{event.action}</code>
          {event.expectedStateVersion !== null ? (
            <span className="text-[9px] text-muted-foreground">token v{event.expectedStateVersion}</span>
          ) : null}
        </div>
        <p className="truncate text-[10px] text-muted-foreground">{event.detail}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-[10px] font-semibold">
          v{event.stateVersionBefore} → v{event.stateVersionAfter}
        </p>
        <p className={`text-[9px] uppercase tracking-[0.12em] ${event.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
          {event.status === "running" ? "Running" : event.durationMs === null ? event.status : `${formatDuration(event.durationMs)} · ${event.status}`}
        </p>
      </div>
    </div>
  )
}

function ActorBadge({ actor }: { actor: FlightActor }) {
  const actorStyle = {
    agent: "border-amber-700/25 bg-amber-500/10 text-amber-900",
    human: "border-primary/25 bg-primary/8 text-primary",
    system: "border-sky-700/25 bg-sky-500/10 text-sky-900",
  }[actor]

  return (
    <Badge variant="outline" className={`rounded-md px-1.5 py-0 text-[9px] uppercase ${actorStyle}`}>
      {actor === "agent" ? <Bot aria-hidden="true" /> : actor === "human" ? <UserRoundCheck aria-hidden="true" /> : <Workflow aria-hidden="true" />}
      {actor}
    </Badge>
  )
}

function capabilityClassName(state: "live" | "used" | "locked"): string {
  const stateStyle = {
    live: "border-emerald-700/35 bg-emerald-600/10 text-emerald-950 shadow-[0_0_0_1px_color-mix(in_oklab,#15803d_12%,transparent)]",
    used: "border-primary/25 bg-primary/8 text-primary",
    locked: "border-border/65 bg-background/55 text-muted-foreground",
  }[state]

  return `flight-capability-node min-w-0 rounded-lg border p-2.5 ${stateStyle}`
}

function nextMoveLabel(phase: DecisionPhase, status: RegistryStatus): string {
  if (!status.available) {
    return status.error ?? "Connect a WebMCP-capable browser"
  }

  if (status.registeredTools.includes("configure_decision_context") && !status.registeredTools.includes("evaluate_resolution_options")) {
    return "Agent can build a decision room from your project brief"
  }

  if (status.registeredTools.includes("evaluate_resolution_options")) {
    return "Agent can author original, situation-specific alternatives"
  }

  if (status.registeredTools.includes("revise_resolution_option")) {
    return "Agent can reason about the constraint and author a revision"
  }

  if (status.registeredTools.includes("simulate_project_impact")) {
    return "Agent can simulate project impact"
  }

  if (status.registeredTools.includes("prepare_change_decision")) {
    return "Agent can prepare the decision"
  }

  if (status.registeredTools.includes("draft_change_order")) {
    return "Agent can draft the approved change order"
  }

  if (phase === "OPTIONS_AVAILABLE") {
    return "Human can add a constraint or select an eligible option"
  }

  if (phase === "READY_FOR_APPROVAL") {
    return "Human approval is required"
  }

  if (phase === "CHANGE_ORDER_DRAFTED") {
    return "Decision package is complete"
  }

  return "Context tools remain available"
}

function formatDuration(durationMs: number): string {
  return durationMs < 1 ? "<1 ms" : `${durationMs} ms`
}
