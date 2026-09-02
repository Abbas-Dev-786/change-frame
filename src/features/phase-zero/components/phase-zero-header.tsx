import { Badge } from "@/components/ui/badge"

export function PhaseZeroHeader() {
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b border-foreground/15 py-5 sm:flex-row sm:items-center">
      <a
        className="inline-flex items-center gap-3 text-sm font-extrabold tracking-[0.03em] uppercase"
        href="#top"
        aria-label="ChangeDecision OS home"
      >
        <span
          className="grid size-9 place-items-center rounded-md bg-foreground text-xs text-background"
          aria-hidden="true"
        >
          CD
        </span>
        <span>ChangeDecision OS</span>
      </a>
      <Badge
        variant="outline"
        className="h-auto px-3 py-1.5 text-[0.7rem] tracking-[0.08em] uppercase"
      >
        Phase 0 · Compatibility spike
      </Badge>
    </header>
  )
}
