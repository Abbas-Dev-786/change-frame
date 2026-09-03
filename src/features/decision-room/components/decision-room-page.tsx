import { useState } from "react"

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
  const [constraintLabel, setConstraintLabel] = useState("Electrical riser")
  const canAddConstraint = room.phase === "OPTIONS_AVAILABLE"
  const previewedOption = getPreviewedOption(room)

  function handleConstraintSubmit(geometry: Rect) {
    if (room.constraints.length > 0) {
      const confirmed = window.confirm(
        "Replace the existing field constraint CONSTRAINT-12?",
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
          canEvaluate={room.phase === "INVESTIGATING"}
          onEvaluate={room.evaluateOptions}
          onReset={room.resetWorkflow}
        />

        <section className="grid gap-4 xl:grid-cols-[minmax(620px,1.35fr)_minmax(420px,0.9fr)]">
          <div className="flex flex-col gap-4">
            <ErrorAlert error={room.lastError} />
            <PlanBoard
              issue={room.activeIssue}
              elements={room.drawingElements}
              constraints={room.constraints}
              options={room.resolutionOptions}
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
            />

            <ConstraintControls
              disabled={!canAddConstraint}
              label={constraintLabel}
              defaultGeometry={room.constraints[0]?.geometry ?? DEFAULT_CONSTRAINT_RECT}
              hasConstraint={room.constraints.length > 0}
              onLabelChange={setConstraintLabel}
              onSubmit={handleConstraintSubmit}
            />
            <WebMcpStatusPanel status={webmcpStatus} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
            <IssuePanel issue={room.activeIssue} schedule={room.schedule} contracts={room.contracts} />
            <OptionsPanel
              phase={room.phase}
              options={room.resolutionOptions}
              selectedOptionId={room.selectedOptionId}
              previewOptionId={previewedOption?.id ?? null}
              hasConstraint={room.constraints.length > 0}
              onPreview={room.previewOption}
              onRevise={room.reviseOption}
              onReject={room.rejectOption}
              onSelect={room.selectOption}
            />
            <OptionComparisonPanel
              options={room.resolutionOptions}
              selectedOptionId={room.selectedOptionId}
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
              onSimulate={() => room.simulateImpact(true)}
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
            />
            <ActivityTimeline events={room.activityLog} />
          </div>
        </section>
      </div>
    </main>
  )
}
