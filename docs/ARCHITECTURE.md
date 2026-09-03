# ChangeFrame Architecture

ChangeFrame is a frontend-only modular monolith with an open-ended agent input boundary.

```text
User project brief
       │
       ▼
Browser agent ──► typed WebMCP proposals ──► runtime guards
                                                │
Human UI ───────────────────────────────────────┤
                                                ▼
                                      pure domain state machine
                                                │
                         ┌──────────────────────┼─────────────────────┐
                         ▼                      ▼                     ▼
                    visible UI          tool capability set    flight recorder
```

## Boundaries

- `src/domain/decision` owns policy, validation, geometry checks and state transitions. It knows nothing about React, Zustand or WebMCP.
- `src/store` adapts pure domain actions to session persistence and UI subscriptions.
- `src/webmcp` owns browser-agent schemas, runtime parsing, responses and dynamic registration.
- `src/features/decision-room` presents the same state to the human and never invents agent output.
- `src/observability` records actor attribution and capability transitions without participating in authorization.

## Data and reasoning model

A fresh state contains one replaceable starter project and issue, but no alternatives or expected answer. `configure_decision_context` can replace that context with project, issue, drawing elements, schedule, contracts, baseline constraints and canvas dimensions supplied at runtime. `evaluate_resolution_options` accepts original structured alternatives from the browser agent. The domain materializes them with provenance and stable revisions.

The model authors project-context structure, alternatives, rationale, assumptions, confidence, estimates, optional route geometry, and optional mitigation. ChangeFrame deterministically verifies schemas, cross-reference integrity, state versions, numeric bounds, canvas bounds, route/constraint intersections, impact arithmetic, and authority.

Determinism is intentionally limited to verification, state safety and automated tests. It no longer supplies product answers.

## Human authority

Selection, rejection and approval are UI-only actions. The WebMCP registry never exposes them. Drafting becomes available only after a decision has an approval timestamp created by the human action.

## Persistence

Same-tab state is stored under schema version 4. Legacy sessions are intentionally ignored. Reset preserves a monotonically increasing state version while returning to the replaceable starter project with no alternatives.
