import { Bot, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DecisionPhase } from "@/src/domain/decision";

const phaseLabels: Record<DecisionPhase, string> = {
  INVESTIGATING: "Investigating",
  OPTIONS_AVAILABLE: "Options available",
  OPTION_SELECTED: "Option selected",
  IMPACT_SIMULATED: "Impact simulated",
  READY_FOR_APPROVAL: "Ready for approval",
  APPROVED: "Approved",
  CHANGE_ORDER_DRAFTED: "Change order drafted",
};

type DecisionHeaderProps = {
  phase: DecisionPhase;
  stateVersion: number;
  projectName: string;
  contextConfigured: boolean;
  contextSource: "starter" | "human" | "agent";
  onReset: () => void;
};

export function DecisionHeader({
  phase,
  stateVersion,
  projectName,
  contextConfigured,
  contextSource,
  onReset,
}: DecisionHeaderProps) {
  return (
    <Card className="rounded-lg border-border/70 bg-card/95 py-3 shadow-sm">
      <CardContent className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-normal text-foreground sm:text-2xl">
              ChangeFrame
            </h1>
            <span aria-live="polite" aria-atomic="true" className="flex gap-2">
              <Badge
                variant="outline"
                className="rounded-md border-primary/25 bg-primary/5 text-primary"
              >
                {phaseLabels[phase]}
              </Badge>
              <Badge variant="secondary" className="rounded-md">
                v{stateVersion}
              </Badge>
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {contextConfigured
              ? `${projectName} · ${contextSource === "starter" ? "Replaceable starter project" : "Live Decision Room"}`
              : "Open-ended agent workspace"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={onReset}
          >
            <RotateCcw aria-hidden="true" />
            Reset workflow
          </Button>
          {/* <Badge variant="outline" className="gap-1.5 rounded-lg border-violet-300 bg-violet-50 px-3 py-2 text-violet-800">
            <Bot aria-hidden="true" className="size-4" />
            Agent-authored options
          </Badge> */}
        </div>
      </CardContent>
    </Card>
  );
}
