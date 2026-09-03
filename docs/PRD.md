# ChangeFrame Product Requirements

**Version:** 3 — Starter context with open-ended agent-authored decisions

## Product goal

Enable a browser agent to transform arbitrary user-supplied construction context into multiple original, auditable resolution alternatives inside a shared visual workspace, while preserving human control of selection and approval.

## Cognitive job

The agent observes project facts and current workflow state, reasons about materially distinct resolutions, acts by submitting structured proposals, observes validation and human constraints, and revises when required.

## P0 requirements

1. A fresh session contains one credible, replaceable starter project and issue, but no preloaded option or expected answer.
2. Runtime context includes project, issue, drawings, plan elements, schedule, contracts and baseline constraints.
3. Cross-references and geometry are validated before context becomes visible.
4. The agent submits 2–5 original alternatives containing strategy, scope, rationale, assumptions, confidence, cost, schedule, risk and optional route geometry.
5. UI cards visibly identify agent authorship and show rationale, assumptions and confidence.
6. Human-drawn constraints invalidate every intersecting route, independent of option ID or strategy name.
7. The agent submits a complete revised proposal; ChangeFrame rejects revisions that still intersect referenced constraints.
8. Only a human can reject or select an option.
9. After human selection, an agent may submit one mitigation with rationale, estimates and confidence. ChangeFrame calculates totals.
10. The agent may prepare but cannot approve a decision.
11. Draft change-order capability appears only after human approval.
12. Every mutation uses optimistic state-version checks and produces an actor-attributed trace.
13. The workflow completes without document reloads.

## Non-goals

- certifying structural, mechanical or code compliance
- treating model estimates as sourced facts
- autonomous selection, approval, signature, issuance or contract execution
- production system-of-record synchronization
- multi-user authentication in the hackathon build

## Trust contract

Agent content is untrusted input. Inputs are schema-validated and bounded. Rationale and assumptions remain visible. Geometry validation proves only rectangle/route non-intersection on the supplied canvas; it does not prove constructability. All consequential authority stays with the human.

## Definition of done

- `npm run verify` passes.
- Browser E2E configures a project that does not exist in production source.
- The production starter contains context only; no resolution-answer fixture exists.
- No option ID, strategy or route receives special-case domain behavior.
- The Agent Flight Recorder shows context ingestion, proposal submission and capability transitions.
