# Build Notes

## 2026-09-01 — Guided build onboarding started

- Participant wants to brainstorm an exceptional idea with a realistic chance of winning The WebMCP Challenge.
- No project concept has been selected yet.
- Active-shaping note: participant explicitly prioritized the judging criteria and competitive differentiation.
- Round 1: participant has no starting idea and wants open exploration.
- Technical calibration: experienced full-stack developer with GenAI and agentic-AI knowledge.
- Round 2 direction: participant is drawn to e-commerce and domain-name products.
- Strategic constraint: avoid the crowded generic shopping-assistant pattern; prefer a workflow where shared browser state, dynamic tools, and human approval are central.
- Round 2 expansion: explore niche, high-consequence industry workflows beyond e-commerce and domains. Selection filter: the page should be a live operational surface, tool availability should change with workflow state, and irreversible actions should require explicit human approval.

## 2026-09-02 — ChangeDecision OS PRD validation and scope lock

- Selected concept: ChangeDecision OS, a WebMCP-native construction decision workspace for resolving an HVAC duct and structural beam conflict.
- Active-shaping note: participant asked to fix the validation findings and explicitly requested a separate future-scope file so deferred tools do not inflate the MVP.
- MVP decision: seven non-overlapping WebMCP tools, one canonical state machine, human-only option selection and approval, deterministic synthetic geometry, and no backend.
- Deferred granular analysis, integrations, multi-project behavior, exports, and advanced drawing capabilities to `docs/FUTURE_SCOPE.md`.
- PRD version advanced to 1.1 with testable P0 criteria, deterministic and probabilistic eval gates, security requirements, persistence semantics, and official submission gates.

## 2026-09-02 — PRD review comments incorporated

- PRD version advanced to 1.2.
- Added explicit rollback phase transitions to prevent derived-state and tool-registry mismatch.
- Limited human constraint editing to `OPTIONS_AVAILABLE`; later phases require reset in the MVP.
- Froze canonical descriptions for all seven tools and required description changes to rerun agent evals.
- Added the invariant that mutation results resolve only after domain state, UI, and registry are coherent.
- Changed route presentation to one emphasized preview plus faint alternatives, with hover and keyboard focus parity.
- Corrected the `exposedTo` explanation and added primary-source construction evidence from Procore, Autodesk, and a peer-reviewed 95-project study.

## 2026-09-02 — Stable constraint identity and retry contract

- PRD version advanced to 1.3.
- Defined the MVP human constraint as a stable singleton: first creation allocates `CONSTRAINT-12`; replacement updates it in place and never allocates another ID.
- Added `createdAt` and `updatedAt` semantics to the constraint contract and acceptance tests.
- Replaced the inaccurate blanket idempotency claim with duplicate-safe and replay-safe semantics.
- Specified that `expectedStateVersion` is validated first, stale replays return `STATE_CONFLICT` with zero side effects, and the agent must reread context before deciding whether to retry.
- Added deterministic coverage for stale post-success replays and valid current-state semantic no-ops.

## 2026-09-02 — Phase 0 WebMCP compatibility spike

- Scaffolded the React, TypeScript, and Vite application without implementing later MVP phases.
- Added the disposable read-only `get_phase_zero_status` imperative WebMCP tool with capability detection, `AbortSignal` lifecycle cleanup, cancellation handling, and visible invocation telemetry.
- Added graceful human-interface fallback when `document.modelContext` is unavailable.
- Added `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)` to local Vite preview/development and Vercel deployment configuration.
- Added focused tests for unsupported browsers, singleton registration, invocation output, cancellation, failed-registration retry, and the human fallback UI.
- Local gates passed: TypeScript, Vitest, production build, dependency audit, and an HTTP response-header check.
- Live browser-agent discovery remains the external Phase 0 gate and must be performed after the participant deploys the site.

## 2026-09-02 — Tailwind, shadcn, and modular architecture pass

- Adopted the participant's explicit implementation constraints: Tailwind CSS for styling, shadcn/ui for shared primitives, feature-oriented modules, and no explicit `any` types.
- Split Phase 0 into model, WebMCP adapter, React hook, and focused presentation components; `App.tsx` is now only the composition root.
- Added a Vite alias for the existing shadcn `@/` imports, architecture documentation, and a `check:no-any` repository gate included in `npm run verify`.
- Rebuilt the spike interface from Tailwind utilities and shadcn primitives while preserving the WebMCP lifecycle and human-readable diagnostics.
- Local browser verification discovered the registered tool and exposed a compatibility edge where a browser agent may omit the execution-options argument; the adapter now accepts that optional argument while retaining abort handling when a signal is supplied.

## 2026-09-02 — Phases 1-4 implemented

- Implemented the pure `src/domain/decision` module for synthetic project data, state-machine actions, duplicate/replay-safe mutations, stable `CONSTRAINT-12` replacement, and route/rectangle geometry checks.
- Added a Zustand-backed central store with same-tab `sessionStorage` restore and reset semantics.
- Replaced the disposable Phase 0 page with the Decision Room product surface: SVG plan, issue facts, options, impact summary, activity timeline, and human constraint controls.
- Added pointer and keyboard-coordinate creation paths for the single MVP blocked-region constraint.
- Implemented deterministic resolution options plus the revised Option A Corridor C East route with `$5,300` and `+1 day` impact.
- Removed the active Phase 0 spike tool source so the running app no longer exposes `get_phase_zero_status`.
