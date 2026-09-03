import { useState } from "react"
import { Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import { DEFAULT_CONSTRAINT_RECT, getPreviewedOption, type ConstraintDraft, type Rect } from "@/src/domain/decision"
import { useDecisionRoom } from "../hooks/use-decision-room"
import { useDecisionWebMcp } from "../hooks/use-decision-webmcp"
import { ActivityTimeline } from "./activity-timeline"
import { ChangeOrderPanel } from "./change-order-panel"
import { ConstraintControls } from "./constraint-controls"
import { DecisionPanel } from "./decision-panel"
import { DecisionReceiptPanel } from "./decision-receipt-panel"
import { DecisionHeader } from "./decision-header"
import { ErrorAlert } from "./error-alert"
import { ImpactPanel } from "./impact-panel"
import { ImpactRipplePanel } from "./impact-ripple-panel"
import { OptionComparisonPanel } from "./option-comparison-panel"
import { IssuePanel } from "./issue-panel"
import { OptionsPanel } from "./options-panel"
import { PlanBoard } from "./plan-board"
import { WebMcpStatusPanel } from "./webmcp-status-panel"

export function DecisionRoomPage() {
  const room = useDecisionRoom()
  const webmcpStatus = useDecisionWebMcp()
  const [constraintLabel, setConstraintLabel] = useState("Field restriction")
  const canAddConstraint = room.phase === "OPTIONS_AVAILABLE"
  const previewedOption = getPreviewedOption(room)

  function handleConstraintSubmit(geometry: Rect) {
    if (room.constraints.length > 0) {
      const confirmed = window.confirm(
        `Replace the existing field constraint ${room.constraints[0]?.id}?`,
      )

      if (!confirmed) {
        return
      }
    }

    const draft: ConstraintDraft = {
      label: constraintLabel,
      geometry,
    }

    room.upsertConstraint(draft)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-[min(1440px,calc(100%_-_2rem))] flex-col gap-4 py-4 lg:py-6">
        <DecisionHeader
          phase={room.phase}
          stateVersion={room.stateVersion}
          projectName={room.project.name}
          contextConfigured={room.contextConfigured}
          contextSource={room.contextSource}
          onReset={room.resetWorkflow}
        />

        {room.contextSource === "starter" ? <StarterProjectBanner /> : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(620px,1.35fr)_minmax(420px,0.9fr)]">
          <div className="flex flex-col gap-4">
            <ErrorAlert error={room.lastError} />
            <PlanBoard
              issue={room.activeIssue}
              elements={room.drawingElements}
              constraints={room.constraints}
              options={room.resolutionOptions}
              drawing={room.drawings.find((drawing) => drawing.id === room.activeDrawingId) ?? room.drawings[0]}
              viewBox={room.planViewBox}
              previewOptionId={previewedOption?.id ?? room.resolutionOptions[0]?.id ?? null}
              canCreateConstraint={canAddConstraint}
              onCreateConstraint={handleConstraintSubmit}
            />

            <ImpactRipplePanel
              issue={room.activeIssue}
              option={room.resolutionOptions.find(
                (option) => option.id === room.impactSimulation?.optionId,
              ) ?? null}
              simulation={room.impactSimulation}
              schedule={room.schedule}
              contracts={room.contracts}
              currency={room.project.currency}
            />

            <ConstraintControls
              disabled={!canAddConstraint}
              label={constraintLabel}
              defaultGeometry={room.constraints[0]?.geometry ?? DEFAULT_CONSTRAINT_RECT}
              hasConstraint={room.constraints.length > 0}
              onLabelChange={setConstraintLabel}
              onSubmit={handleConstraintSubmit}
            />
            <WebMcpStatusPanel
              status={webmcpStatus}
              phase={room.phase}
              stateVersion={room.stateVersion}
              hasConstraint={room.constraints.length > 0}
              hasSelection={room.selectedOptionId !== null}
              isApproved={room.decision?.status === "APPROVED"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
            <IssuePanel issue={room.activeIssue} schedule={room.schedule} contracts={room.contracts} />
            <OptionsPanel
              phase={room.phase}
              options={room.resolutionOptions}
              selectedOptionId={room.selectedOptionId}
              previewOptionId={previewedOption?.id ?? null}
              hasConstraint={room.constraints.length > 0}
              currency={room.project.currency}
              onPreview={room.previewOption}
              onReject={room.rejectOption}
              onSelect={room.selectOption}
            />
            <OptionComparisonPanel
              options={room.resolutionOptions}
              selectedOptionId={room.selectedOptionId}
              currency={room.project.currency}
              onPreview={room.previewOption}
            />
            <ImpactPanel
              project={room.project}
              selectedOption={room.resolutionOptions.find(
                (option) => option.id === room.selectedOptionId,
              ) ?? null}
              simulation={room.impactSimulation}
            />
            <DecisionPanel
              phase={room.phase}
              simulation={room.impactSimulation}
              decision={room.decision}
              onSimulate={() => room.simulateImpact(null)}
              onPrepare={room.prepareDecision}
              onApprove={room.approveDecision}
            />
            <ChangeOrderPanel
              project={room.project}
              contracts={room.contracts}
              changeOrder={room.changeOrder}
              decision={room.decision}
              canDraft={room.phase === "APPROVED"}
              onDraft={room.draftChangeOrder}
            />
            <DecisionReceiptPanel
              decision={room.decision}
              option={room.resolutionOptions.find(
                (option) => option.id === room.decision?.optionId,
              ) ?? null}
              constraint={room.constraints[0] ?? null}
              simulation={room.impactSimulation}
              changeOrder={room.changeOrder}
              currency={room.project.currency}
            />
            <ActivityTimeline events={room.activityLog} />
          </div>
        </section>
      </div>
    </main>
  )
}

function StarterProjectBanner() {
  return (
    <Card className="rounded-lg border-violet-300/60 bg-gradient-to-r from-violet-50 via-card to-cyan-50 py-3 shadow-sm">
      <CardContent className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-violet-600 text-white"><Sparkles aria-hidden="true" className="size-4" /></span>
          <div><h2 className="font-semibold">Starter project ready</h2><p className="text-sm text-muted-foreground">Ask the agent to create original options for this issue, or replace the context with any project brief. No resolution is preselected or stored.</p></div>
        </div>
        <Badge className="w-fit rounded-md bg-violet-600 text-white">Replaceable context</Badge>
      </CardContent>
    </Card>
  )
}
