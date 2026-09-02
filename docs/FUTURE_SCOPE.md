# ChangeDecision OS — Future Scope

**Status:** Deferred until the hackathon MVP Definition of Done passes  
**Source of truth for MVP:** [`PRD.md`](./PRD.md)  
**Purpose:** Maintain an explicit backlog of future WebMCP tools and product capabilities without expanding the current build.

---

# 1. Scope Governance

Nothing in this file is part of the hackathon MVP.

A future item may move into the active product specification only when:

1. every P0 requirement in `PRD.md` passes
2. the six agent evals and full-run reliability gate pass
3. the public submission package is complete
4. the item solves a distinct user goal without overlapping an existing tool
5. its state preconditions, security boundary, duplicate/replay-safety behavior, errors, UI result, and eval are specified

The default decision is to keep a capability in this file.

---

# 2. Future WebMCP Tool Registry

These are candidates, not commitments. Names may change when their user goal and contract are designed.

## Horizon 1 — Deeper Decision Analysis

| Candidate tool | User goal | Why deferred |
|---|---|---|
| `get_active_issue` | Read only the active issue when a full decision context is unnecessary | The MVP's `get_decision_context` already covers the hero flow. |
| `get_project_context` | Retrieve broader budget, contract, drawing, and schedule context | Granular context adds tool-selection ambiguity in the single-project MVP. |
| `get_project_constraints` | Retrieve baseline constraints separately from human annotations | Consolidated context is simpler and more reliable for the demo. |
| `get_resolution_options` | Read all generated options without recalculating them | The MVP can return options through context and generation results. |
| `compare_resolution_options` | Produce a ranked side-by-side comparison with explicit trade-offs | A dedicated comparison experience is not required for the hero decision. |
| `simulate_cost_impact` | Inspect labor, material, equipment, and subcontract cost details independently | Combined project impact is sufficient for the MVP. |
| `simulate_schedule_impact` | Inspect activity dependencies, float, and milestone effects independently | Combined project impact is sufficient for the MVP. |
| `simulate_schedule_mitigation` | Compare multiple acceleration or resequencing mitigations | The MVP supports one deterministic additional-crew mitigation. |
| `evaluate_custom_resolution` | Evaluate a user-supplied strategy beyond the three fixture options | Requires a real rules engine or model-backed analysis and stronger safety controls. |
| `explain_resolution_risk` | Explain engineering, constructability, commercial, and coordination risks | Requires sourced domain rules and review semantics. |

## Horizon 2 — Decision Artifacts and Collaboration

| Candidate tool | User goal | Required boundary |
|---|---|---|
| `draft_rfi` | Prepare an RFI from the current issue and selected resolution | Draft only; human reviews before sending. |
| `draft_submittal_revision` | Prepare a submittal-revision outline from an approved decision | Draft only; no autonomous issuance. |
| `export_decision_package` | Bundle decision, drawing markup, impacts, and history | Explicit format and file-access controls. |
| `export_change_order_pdf` | Render the approved HTML draft as a PDF | Must preserve draft status and accessibility. |
| `request_engineering_review` | Prepare a review request for an option requiring design validation | Human confirmation before any external message. |
| `get_decision_history` | Retrieve prior revisions and the reasons they changed | Requires durable persistence and bounded output. |
| `reopen_decision` | Reopen an approved decision when new field information appears | High-impact human confirmation and immutable audit history. |

## Horizon 3 — Multi-Project and Integrations

| Candidate tool | User goal | Required foundation |
|---|---|---|
| `list_projects` | Find projects with unresolved decisions | Authentication, authorization, pagination, and tenant isolation. |
| `list_open_decisions` | Prioritize active decision exposure across projects | Durable backend and role-aware filtering. |
| `open_decision_room` | Move to a selected project decision context | Explicit navigation semantics and permission checks. |
| `sync_procore_issue` | Import or update a Procore issue | Authorized integration, conflict handling, audit log, and retries. |
| `sync_autodesk_issue` | Import or update an Autodesk Construction Cloud issue | Authorized integration, schema mapping, and rate-limit handling. |
| `import_primavera_activities` | Load real schedule activities and dependencies | Data validation, provenance, and partial-failure handling. |
| `publish_approved_change` | Send an approved draft to a downstream change-management system | Separate human authorization at execution time plus an explicit replay-key and duplicate-prevention design for external writes. |

---

# 3. Actions That Must Remain Human-Only

The following are intentionally **not** future WebMCP tools:

```text
approve_decision
authorize_cost
execute_contract_change
sign_change_order
issue_rfi
override_engineering_review
```

Agents may prepare the information surrounding these actions, but authority remains with an authenticated human.

---

# 4. Future Product Capabilities

## Plan and Drawing Experience

- zoom and pan
- drawing switching
- multiple simultaneous constraints
- constraint deletion and editing
- route or element locking
- additional markup types
- real CAD, IFC, or BIM ingestion
- automatic clash detection

## Decision Experience

- dedicated option comparison view
- option rejection reasons
- explicit **Reopen alternatives** action after option selection
- multiple mitigation strategies
- cost and schedule charts
- immutable decision history
- decision reopening and supersession
- architect, engineer, owner, and subcontractor review steps

## Platform

- backend persistence across devices
- authentication and role-based authorization
- multi-project navigation
- multiple human collaborators
- notifications and approval queues
- organization audit logs
- offline and reconnection behavior

## Presentation and Export

- PDF exports
- branded decision packages
- animation polish
- dark mode
- responsive tablet layout
- configurable project templates

---

# 5. Template for Adding a Future Tool

Add future candidates using this structure:

```markdown
## `tool_name`

User goal:

Why the existing tools cannot satisfy it:

Earliest valid workflow phase:

Read or mutation:

Human confirmation requirement:

Input and output summary:

Duplicate/replay-safety rule (including whether a replay key is required):

Failure and recovery behavior:

Security and untrusted-content considerations:

Required UI result:

Deterministic tests and agent eval:
```

No future tool should be implemented directly from its name alone.
