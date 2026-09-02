import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"

import { EnvironmentDiagnosticsCard } from "./environment-diagnostics-card"
import { PhaseZeroHeader } from "./phase-zero-header"
import { RegistrationStatusAlert } from "./registration-status-alert"
import { ToolRegistrationCard } from "./tool-registration-card"
import { VerificationCard } from "./verification-card"
import { usePhaseZero } from "../hooks/use-phase-zero"
import { PHASE_ZERO_TOOL_NAME } from "../model/phase-zero"

export function PhaseZeroPage() {
  const spike = usePhaseZero()

  return (
    <main
      id="top"
      className="min-h-svh bg-[linear-gradient(color-mix(in_oklch,var(--foreground)_4%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_4%,transparent)_1px,transparent_1px)] bg-[size:32px_32px]"
    >
      <div className="mx-auto w-[min(1180px,calc(100%_-_2rem))] pb-8">
        <PhaseZeroHeader />

        <section className="grid items-end gap-12 py-16 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] lg:gap-16 lg:py-24">
          <div>
            <p className="mb-5 text-xs font-extrabold tracking-[0.13em] text-orange-700 uppercase">
              Agent-native construction decisions
            </p>
            <h1 className="max-w-3xl text-5xl leading-[0.96] font-medium tracking-[-0.05em] text-balance sm:text-6xl lg:text-7xl">
              Prove the browser connection before building the product.
            </h1>
            <p className="mt-6 mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              This disposable spike validates that a deployed ChangeDecision OS
              page can expose a structured, read-only WebMCP tool to a browser
              agent.
            </p>
            <RegistrationStatusAlert
              status={spike.status}
              error={spike.error}
            />
          </div>

          <ToolRegistrationCard
            invocationCount={spike.invocationCount}
            lastInvokedAt={spike.lastInvokedAt}
          />
        </section>

        <section
          className="grid divide-y border-y border-foreground/15 md:grid-cols-3 md:divide-x md:divide-y-0"
          aria-label="Phase 0 verification"
        >
          <EnvironmentDiagnosticsCard diagnostics={spike} />
          <VerificationCard index="02" title="Agent prompt">
            <p>Open this page in a supported browser agent and ask:</p>
            <blockquote className="mt-5 border-l-2 border-orange-700 pl-4 text-base leading-7 text-foreground italic">
              “Check whether the ChangeDecision OS Phase 0 WebMCP spike is
              ready.”
            </blockquote>
          </VerificationCard>
          <VerificationCard index="03" title="Pass condition">
            <p>
              The agent discovers <Kbd>{PHASE_ZERO_TOOL_NAME}</Kbd>, invokes it
              with an empty object, reports <Kbd>status: ready</Kbd>, and this
              page increments the invocation count.
            </p>
          </VerificationCard>
        </section>

        <Separator className="sr-only" />
        <footer className="flex flex-col items-start justify-between gap-2 pt-5 text-[0.7rem] tracking-[0.06em] text-muted-foreground uppercase sm:flex-row">
          <span>Riverside Office Tower · HVAC conflict workflow</span>
          <span>Temporary spike — remove before Phase 1</span>
        </footer>
      </div>
    </main>
  )
}
