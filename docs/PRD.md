# ChangeDecision OS — Product Requirements Document

**Version:** 1.3  
**Status:** MVP Scope Locked — Validated for Build  
**Product Type:** WebMCP-native construction decision workspace  
**Primary Goal:** WebMCP Challenge submission  
**Target User:** Construction Project Manager / General Contractor Project Manager  
**Hero Workflow:** Resolve an HVAC duct–structural beam conflict collaboratively with an AI agent

**Scope boundary:** This document defines only the hackathon MVP. Deferred tools and product capabilities are tracked in [`FUTURE_SCOPE.md`](./FUTURE_SCOPE.md) and must not enter the MVP unless every Definition of Done requirement in this document already passes.

---

# 1. Executive Summary

ChangeDecision OS is an agent-native construction decision room where project teams and AI agents investigate project changes together, explore resolution alternatives, understand cost and schedule consequences, and prepare approved change decisions for downstream execution.

Traditional construction software records issues, RFIs, schedule changes, budget impacts, and change orders across separate workflows.

ChangeDecision OS focuses on the missing layer between:

**“A problem was discovered.”**

and

**“A change order was created.”**

That missing layer is the **decision itself**.

The product gives the human and their browser agent a shared visual workspace containing:

- construction plan
- active issue
- project constraints
- resolution alternatives
- cost impact
- schedule impact
- decision history
- approval state

The human provides judgment, constraints, physical-world context, and authority.

The agent performs investigation, comparison, repetitive analysis, simulation, and preparation of downstream artifacts.

Both operate on the same live application state.

This is the central WebMCP thesis of the product.

WebMCP allows websites to expose structured tools directly to browser agents through `document.modelContext`, giving agents explicit actions instead of forcing them to infer UI interactions from mouse clicks and DOM structure. 

---

# 2. Hackathon Thesis

ChangeDecision OS should demonstrate that WebMCP enables a category of software beyond:

- chatbot embedded in SaaS
- agent controlling a website through clicks
- REST API wrapped as agent tools
- ordinary MCP backend
- AI-generated reports

The demonstration must communicate:

> **The construction application itself becomes a collaborative environment shared by a human and their agent.**

The critical interaction is:

**Human changes visual application state → agent discovers that updated state → agent invokes structured WebMCP tools → application visibly changes → human reviews or overrides → agent continues from the new state.**

The official WebMCP Challenge emphasizes originality, execution, usefulness, thoughtful WebMCP use, and the quality of the human-agent experience. 

Therefore, the MVP must optimize for:

| Criterion | Product Response |
|---|---|
| WebMCP Leverage | Deep structured tool integration with live app state |
| Execution | One polished end-to-end workflow |
| Potential Impact | Real construction change-decision problem |
| Creativity & Ambition | Shared construction decision room |
| Human-Agent Experience | Continuous collaborative loop |
| Demo Strength | Highly visual plan manipulation and impact simulation |

---

# 3. Product Vision

## Vision

Construction teams should be able to make complex project decisions with an AI agent operating beside them inside their existing project workspace rather than copying information into a chatbot.

## Product Promise

> **Turn construction changes into informed decisions, not administrative chaos.**

## Positioning

Traditional construction software:

**tracks what happened.**

ChangeDecision OS:

**helps the project team decide what should happen next.**

---

# 4. Target Persona

## Primary Persona

### General Contractor Project Manager

Responsible for:

- coordinating subcontractors
- reviewing field issues
- managing RFIs
- protecting project schedule
- monitoring budget impact
- evaluating change requests
- coordinating design teams
- obtaining approvals
- preparing change documentation

The project manager frequently needs to combine information from drawings, schedules, contracts, subcontractors, and field reports before making a decision.

## Secondary Personas

Future versions may support:

- Superintendent
- MEP coordinator
- Architect
- Owner representative
- Cost estimator
- Subcontractor PM

These are not separate MVP experiences.

---

# 5. Core Problem

Construction changes rarely involve a single variable.

A field conflict may affect:

```text
geometry
+
scope
+
cost
+
schedule
+
contracts
+
other trades
+
approval requirements
```

Existing tools often record these artifacts separately.

The project manager becomes the integration layer.

For example:

> An HVAC subcontractor discovers that a duct conflicts with structural beam B14.

The team now needs to determine:

- where the conflict occurs
- which parties are affected
- whether the beam can move
- whether the duct can reroute
- what alternatives exist
- what each option costs
- how each option affects the schedule
- which contractual scopes change
- which option should be selected
- who must approve it

The problem is therefore not merely:

> “Create a change order.”

The actual problem is:

> **“Help the team make the best possible change decision.”**

## Industry Evidence and Product Boundary

The workflow problem is supported by existing construction practice and research:

- [Procore's Change Events guidance](https://support.procore.com/products/online/user-guide/project-level/change-events/tutorials/create-change-events) treats a change event as affecting original scope and potentially schedule or unexpected cost. Its workflow gathers documented potential cost and schedule impact before a team creates a Potential Change Order.
- [Autodesk Construction Cloud's Potential Change Order guidance](https://help.autodesk.com/cloudhelp/ENU/Build-Cost/files/change-orders/Cost_Potential_Change_Orders.html) describes a PCO as the starting point of a budget or cost change, allows it to originate from an RFI, issue, or submittal, and links cost items to affected budgets, contracts, and suppliers.
- A peer-reviewed [study of 95 new public-school projects](https://oasis.library.unlv.edu/fac_articles/629/) analyzed change orders to quantify cost and schedule growth and assess their effect on both outcomes.

These sources validate that construction changes cross scope, cost, schedule, and contract workflows. They do not by themselves validate product-market fit for ChangeDecision OS.

ChangeDecision OS is not intended to replace Procore, Autodesk Construction Cloud, or another system of record. Those platforms capture and administer change artifacts. This MVP focuses on the preceding decision interval: investigating a field issue, comparing supported resolutions, incorporating human context, understanding consequences, and deciding which resolution should become a downstream change artifact.

---

# 6. Hero Scenario

The MVP revolves around one fictional project.

## Project

**Riverside Office Tower**

## Location

Level 4 — Mechanical Room / Corridor C

## Issue

**ISS-019 — HVAC Duct / Structural Beam Conflict**

A 24-inch supply duct intersects structural beam B14.

### Initial project state

```text
Issue:
ISS-019

Severity:
High

Affected systems:
Mechanical
Structural

Primary drawing:
M-204

Related drawing:
S-202

Affected schedule activity:
MEP-342 — Level 4 Duct Installation

Potential schedule exposure:
3–6 days

Beam movement:
Prohibited for this decision

Current status:
Decision Required
```

---

# 7. Hero User Journey

## Phase 1 — Investigation

The user opens Issue ISS-019.

The Decision Room displays:

- relevant plan
- clash marker
- issue description
- related schedule activity
- preliminary cost exposure
- project constraints

The user tells their browser agent:

> “Investigate this conflict and show me possible ways to resolve it without moving the beam.”

The agent discovers and invokes the two WebMCP tools available in the investigation state:

```text
get_decision_context
evaluate_resolution_options
```

The agent then evaluates three supported strategies.

---

# 8. Resolution Alternatives

The MVP contains three realistic predefined resolution strategies.

## Option A — Reroute duct through Corridor C

```text
Cost impact:       +$4,800
Schedule impact:   +1 day
Structural change: none
Mechanical impact: minor
Risk:              low
```

## Option B — Reduce duct size and increase air velocity

```text
Cost impact:       +$2,100
Schedule impact:    0 days
Structural change: none
Mechanical impact: moderate
Risk:              acoustic / engineering review
```

## Option C — Split into two smaller ducts

```text
Cost impact:       +$6,400
Schedule impact:   +2 days
Structural change: none
Mechanical impact: significant
Risk:              low
```

The agent materializes these options inside the web application.

The plan renders corresponding route overlays.

---

# 9. The Hero WebMCP Moment

This interaction is the centerpiece of the submission.

The user reviews Option A.

The proposed route passes through an electrical riser zone.

The user manually marks the region on the plan:

```text
┌──────────────────────┐
│ 🚫 BLOCKED REGION    │
│ Electrical riser     │
└──────────────────────┘
```

The application stores this as a structured project constraint:

```json
{
  "id": "CONSTRAINT-12",
  "type": "blocked_region",
  "source": "human",
  "drawingId": "M-204",
  "label": "Electrical riser",
  "appliesTo": ["mechanical_route"],
  "createdAt": "2026-09-02T10:15:00.000Z",
  "updatedAt": "2026-09-02T10:15:00.000Z"
}
```

The user then tells their agent:

> “Try option A again, but respect the area I just marked.”

The agent invokes:

```text
get_user_constraints
```

The newly created constraint is returned.

The agent then invokes:

```text
revise_resolution_option
```

The web application:

1. removes the previous route overlay
2. calculates the supported alternate path
3. displays the new route
4. updates cost impact
5. updates schedule impact
6. records the revision in activity history

Example result:

```text
OPTION A — REVISION 2

Reroute through Corridor C East

Cost
+$5,300

Schedule
+1 day

New constraint respected
✓ Electrical riser avoided
```

This interaction must work reliably in the final demo.

---

# 10. Why This Requires WebMCP

Without WebMCP, an agent would need to infer:

- which drawing is active
- which issue is selected
- what the human just annotated
- which UI control creates an alternative
- where an annotation exists
- which budget values changed
- which schedule tasks correspond to the issue

This would require DOM interpretation, screenshots, coordinate clicking, or a separate backend API.

With WebMCP, the application exposes explicit semantic capabilities:

```text
get_decision_context()

get_user_constraints()

evaluate_resolution_options()

revise_resolution_option()

simulate_project_impact()

prepare_change_decision()

draft_change_order()
```

The browser agent operates using these structured contracts.

Chrome describes WebMCP's goal as making agent actuation more accurate and reliable by exposing structured site capabilities rather than requiring simulated user interaction. 

The agent path must not depend on clicking visual controls. Option selection and approval are deliberate exceptions because they are reserved for the human rather than alternative agent actuation paths.

---

# 11. Product Surface

The MVP is primarily **one screen**.

## Decision Room

```text
┌───────────────────────────────────────────────────────────────┐
│ ChangeDecision OS                     Riverside Office Tower  │
├────────────────────────────────┬──────────────────────────────┤
│                                │ ISSUE #019                   │
│                                │                              │
│                                │ HVAC duct conflicts with    │
│       CONSTRUCTION PLAN        │ structural beam B14          │
│                                │                              │
│  ───────── DUCT ───────        │ HIGH                         │
│                │               │                              │
│                █ BEAM          │ Schedule risk                │
│                ⚠              │ 3–6 days                     │
│                                │                              │
│     proposed route overlay     ├──────────────────────────────┤
│                                │ RESOLUTION OPTIONS           │
│     human annotations          │                              │
│                                │ A — Reroute       +$4.8K    │
│                                │                   +1 day     │
│                                │                              │
│                                │ B — Resize        +$2.1K    │
│                                │                    0 days    │
│                                │                              │
│                                │ C — Split         +$6.4K    │
│                                │                   +2 days    │
├────────────────────────────────┼──────────────────────────────┤
│ PROJECT IMPACT                 │ DECISION ACTIVITY            │
│                                │                              │
│ Budget       +$4,800           │ Agent inspected conflict     │
│ Schedule     +1 day            │ 3 options evaluated          │
│ Activity     MEP-342           │ User added constraint        │
│ Contract     MEP-04            │ Option A revised             │
└────────────────────────────────┴──────────────────────────────┘
```

---

# 12. UI Requirements

## Construction Plan

Use an SVG-based synthetic construction plan.

SVG is preferred over a raster image because application objects can map directly to structured domain entities.

Example:

```text
DUCT-D22
BEAM-B14
ROOM-M401
CORRIDOR-C3
RISER-E04
```

The plan must support:

- element highlighting
- issue pins
- resolution route overlays
- blocked-region annotations
- selection
- reset

Zoom, pan, and drawing switching are deferred because the single synthetic plan fits within the MVP viewport. They are tracked in `FUTURE_SCOPE.md`.

Real CAD/BIM parsing is explicitly out of scope.

---

# 13. Human Annotation Interaction

Users must be able to:

- activate “Add constraint”
- draw rectangular blocked region
- label the constraint
- inspect constraint
- create the same rectangular region with keyboard-accessible coordinate fields instead of drag input

Annotation creation must update the central application state immediately.

The agent must be able to retrieve the same constraint through WebMCP without additional synchronization.

The MVP supports one active human blocked-region constraint. Its identity is stable and deterministic:

- creating the first constraint allocates `CONSTRAINT-12`
- creating another asks the user to confirm replacement
- confirmed replacement updates `CONSTRAINT-12` in place; it never deletes it or allocates a new constraint ID
- replacement may change `geometry`, `label`, `drawingId`, and `appliesTo`
- `createdAt` remains the timestamp of the first creation; `updatedAt` changes on replacement

This stable identity keeps the `revise_resolution_option.constraintIds` enum valid for the full MVP lifecycle. Deletion, multiple simultaneous constraints, and route locking are deferred to `FUTURE_SCOPE.md`.

Constraint creation and replacement controls are enabled only in `OPTIONS_AVAILABLE`. They become read-only in `OPTION_SELECTED`, `IMPACT_SIMULATED`, `READY_FOR_APPROVAL`, `APPROVED`, and `CHANGE_ORDER_DRAFTED`. The MVP does not implement **Reopen alternatives**; the user must use **Reset workflow** to change constraint geometry after selecting an option. The domain action still implements defensive rollback if invoked unexpectedly from any pre-approval phase.

---

# 14. Resolution Panel

Each option card must show:

- option title
- short description
- cost impact
- schedule impact
- risk
- constraint status
- selected/unselected status

The user can manually:

- select option
- inspect option

Only the human can select an option in the MVP. Rejection workflows and a dedicated comparison view are deferred to `FUTURE_SCOPE.md`.

Option selection controls remain available through `IMPACT_SIMULATED`; changing the option rolls the workflow back to `OPTION_SELECTED` and clears the prior simulation. Selection becomes read-only in `READY_FOR_APPROVAL` and every later phase.

---

# 15. Project Impact Panel

Before milestone mitigation, the selected revised option updates:

### Budget

```text
Base project budget
$8,420,000

Selected change
+$5,300

Projected budget
$8,425,300
```

After the `$1,200` mitigation is accepted by the simulation, the final projected budget must update to `$8,426,500`. The interface must label the pre-mitigation and final totals so `$5,300` and `$6,500` are never presented as competing values for the same state.

### Schedule

Example:

```text
MEP-342
Duct Installation

Before
Sep 12 → Sep 16

After
Sep 12 → Sep 17
```

If the user requires the inspection date to remain fixed, an alternate mitigation can be simulated:

```text
Add second MEP crew

Additional cost
+$1,200

Recovered schedule
1 day

Final schedule impact
0 days
```

---

# 16. Final Decision

Once an option is selected and simulated, the application creates a Decision Summary.

Example:

```text
DECISION DEC-019

Issue
HVAC duct conflicts with beam B14

Selected resolution
Reroute duct through Corridor C East

Cost impact
+$6,500

Schedule impact
0 days

Mitigation
Add second MEP crew for one shift

Affected drawing
M-204

Affected schedule activity
MEP-342

Affected contract
MEP-04

Status
READY FOR APPROVAL
```

---

# 17. Change Order Output

After human approval, the `draft_change_order` WebMCP tool becomes available. The agent may then invoke it to generate a lightweight change-order draft.

Example:

```text
CHANGE ORDER DRAFT
CO-007

Project
Riverside Office Tower

Reason
Field coordination conflict between mechanical duct D22
and structural beam B14.

Approved resolution
Reroute supply duct through Corridor C East and add
additional MEP labor to preserve inspection milestone.

Cost impact
+$6,500

Schedule impact
0 days

Affected contract
MEP-04

Decision reference
DEC-019
```

PDF export is deferred to `FUTURE_SCOPE.md`. The MVP produces only a polished HTML change-order panel.

---

# 18. Human vs Agent Responsibility Model

## Agent Responsibilities

The agent may:

- inspect project context
- retrieve issue information
- retrieve constraints
- evaluate supported alternatives
- compare alternatives
- calculate project impacts
- revise alternatives
- prepare decision summary
- draft change order

## Human Responsibilities

The human must retain authority over:

- physical/contextual constraints
- final option selection
- acceptance of commercial impact
- project approval
- final change commitment

The agent assists with the decision.

The agent does not become the construction authority.

---

# 19. WebMCP Architecture

The MVP uses only the current imperative API surface:

```javascript
document.modelContext.registerTool(...)
```

The application must detect this capability before registration. If it is unavailable, the human interface remains usable and displays a clear “WebMCP unavailable in this browser” notice with testing guidance. The app must never crash solely because `document.modelContext` is missing.

Each workflow phase owns an `AbortController` for its registered tools. A state-changing tool follows this order:

1. validate the input, expected version, and phase preconditions
2. execute one atomic domain transaction
3. commit the central store and increment `stateVersion`
4. render the resulting visible UI
5. reconcile registrations and removals for the resulting phase
6. return the tool result

**Coherence invariant:** A state-changing WebMCP tool does not resolve until domain state, visible UI state, and the exposed WebMCP tool set all represent the same resulting phase.

The application must not abort a tool registration while that tool's execution is still applying state. Every tool execution must also accept the execution `signal` and stop optional long-running work when cancelled. Registry reconciliation may briefly register and remove tools internally, but the final set must match the phase table before the tool promise resolves.

Dynamic registration is used only when availability communicates a real domain precondition. `get_decision_context` and `get_user_constraints` remain available throughout the workflow; mutation tools appear only when valid.

---

# 20. MVP WebMCP Tool Strategy

The MVP exposes exactly seven domain tools:

| Tool | Type | User goal |
|---|---|---|
| `get_decision_context` | Read | Understand the active issue and current decision state |
| `get_user_constraints` | Read | Discover the constraint the human added to the plan |
| `evaluate_resolution_options` | Mutation | Materialize all three supported alternatives |
| `revise_resolution_option` | Mutation | Revise one option against the human constraint |
| `simulate_project_impact` | Mutation | Calculate combined cost, schedule, and mitigation impact |
| `prepare_change_decision` | Mutation | Prepare a decision for human approval |
| `draft_change_order` | Mutation | Draft the downstream artifact after human approval |

The MVP does not expose UI-mechanical tools such as `click_option_card`, `open_panel`, or `approve_decision`. It also avoids overlapping granular tools. Future tools are listed in `FUTURE_SCOPE.md`.

## Canonical Tool Descriptions

The following descriptions are implementation requirements and must be registered verbatim. Any description change requires rerunning the complete agent eval suite.

| Tool | Canonical description |
|---|---|
| `get_decision_context` | Read the active construction issue, baseline constraints, current decision phase, selected option, and state version. Use to understand the Decision Room and determine the next valid action. This does not change application state. |
| `get_user_constraints` | Read the human-created plan constraint currently visible in the Decision Room, including geometry and applicability. Use before revising a resolution option. Returned labels are untrusted human content. This does not change application state. |
| `evaluate_resolution_options` | Generate and display the three supported construction resolution options for the active issue. Use after reading decision context while the phase is INVESTIGATING. This updates the shared Decision Room but does not select or approve an option. |
| `revise_resolution_option` | Revise an existing construction resolution option to respect the human's current plan constraint. Use after resolution options exist and `get_user_constraints` has returned a constraint. This updates the shared Decision Room but does not select or approve the option. |
| `simulate_project_impact` | Calculate and display combined cost, schedule, and milestone mitigation for the human-selected option. Use only after the human selects an option. This updates the shared Decision Room but does not prepare or approve the decision. |
| `prepare_change_decision` | Prepare the currently simulated construction resolution for human review and approval. Use only after `simulate_project_impact` succeeds. This does not approve the decision. |
| `draft_change_order` | Create and display a draft change order from the human-approved decision. Use only after the phase is APPROVED. This creates a draft document and does not execute, sign, or authorize a contract change. |

---

# 21. Common Tool Contract

All tools use JSON Schema with `additionalProperties: false`. Every required parameter is listed in `required`, and enum values are used wherever the demo supports a closed set.

Successful responses use:

```json
{
  "success": true,
  "stateVersion": 4,
  "data": {}
}
```

Failures use:

```json
{
  "success": false,
  "stateVersion": 4,
  "error": "STATE_CONFLICT",
  "message": "The decision changed. Read the current context and retry.",
  "retryable": true
}
```

Mutation tools are **duplicate-safe and replay-safe**. The MVP does not use a separate idempotency or replay key, so an exact network retry is not guaranteed to return the original successful response. The contract is:

1. Validate `expectedStateVersion` before any other mutation logic.
2. If it does not equal the current version, return `STATE_CONFLICT` with the current `stateVersion` and zero side effects.
3. After `STATE_CONFLICT`, the agent must call `get_decision_context`, determine whether the intended operation already succeeded, and only then decide whether a new call is needed.
4. A valid current-state re-execution or upsert must not create duplicate entities or activity events.

Duplicate prevention uses deterministic identities and operation fingerprints:

- option generation upserts the fixed IDs `OPTION-A`, `OPTION-B`, and `OPTION-C`
- applying the same constraint fingerprint to the current option revision returns the existing revision
- simulation is unique for the selected-option revision and milestone-preservation choice
- decision preparation is unique for the current simulation fingerprint
- one change-order draft exists per approved decision

A semantic no-op succeeds with the current entity, does not increment `stateVersion`, and does not append an activity event. A stale replay returns `STATE_CONFLICT`; it never duplicates options, revisions, simulations, decisions, activity events, or change orders.

Common error codes:

```text
NO_ACTIVE_ISSUE
INVALID_STATE
OPTION_NOT_FOUND
OPTION_NOT_SELECTED
CONSTRAINT_NOT_FOUND
SIMULATION_REQUIRED
STATE_CONFLICT
HUMAN_APPROVAL_REQUIRED
WEBMCP_UNAVAILABLE
```

---

# 22. Read Tool Contracts

## `get_decision_context`

Purpose: Return the minimum structured context required to understand the active issue and choose the next valid action.

Annotations:

```javascript
{ readOnlyHint: true }
```

Input schema:

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

Example `data`:

```json
{
  "project": { "id": "PROJECT-01", "name": "Riverside Office Tower", "budget": 8420000 },
  "issue": {
    "id": "ISS-019",
    "title": "HVAC duct conflicts with structural beam B14",
    "severity": "high",
    "drawingId": "M-204",
    "location": "Level 4 Mechanical Room / Corridor C"
  },
  "baselineConstraints": [
    { "id": "BASE-01", "type": "fixed_element", "label": "Beam B14 cannot move" }
  ],
  "phase": "INVESTIGATING",
  "selectedOptionId": null
}
```

## `get_user_constraints`

Purpose: Return the active visual constraint created by the human, including enough geometry and applicability metadata for the agent to select a compatible revision action.

Annotations:

```javascript
{ readOnlyHint: true, untrustedContentHint: true }
```

Input schema is an empty object with `additionalProperties: false`.

Example `data`:

```json
{
  "constraints": [
    {
      "id": "CONSTRAINT-12",
      "type": "blocked_region",
      "label": "Electrical riser",
      "source": "human",
      "drawingId": "M-204",
      "geometry": { "x": 510, "y": 180, "width": 120, "height": 160 },
      "appliesTo": ["mechanical_route"],
      "createdAt": "2026-09-02T10:15:00.000Z",
      "updatedAt": "2026-09-02T10:18:30.000Z"
    }
  ]
}
```

---

# 23. Analysis Tool Contracts

## `evaluate_resolution_options`

Purpose: Materialize all three predefined resolution strategies in one deterministic operation.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "expectedStateVersion": { "type": "integer", "minimum": 0 }
  },
  "required": ["expectedStateVersion"],
  "additionalProperties": false
}
```

The response returns summaries for `OPTION-A`, `OPTION-B`, and `OPTION-C`. The UI must create three option cards and three overlay models before the tool resolves. Option A is emphasized by default; the other routes are faint ghost paths. Hovering or keyboard-focusing an option card previews that route at full emphasis without selecting it or changing `stateVersion`. Re-executing the underlying upsert from a valid current state never creates duplicate options or activity events. An exact replay carrying the pre-success `expectedStateVersion` returns `STATE_CONFLICT` with zero side effects.

## `revise_resolution_option`

Purpose: Revise a generated option against the active human constraint.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "optionId": { "type": "string", "enum": ["OPTION-A", "OPTION-B", "OPTION-C"] },
    "constraintIds": {
      "type": "array",
      "items": { "type": "string", "enum": ["CONSTRAINT-12"] },
      "minItems": 1,
      "maxItems": 1,
      "uniqueItems": true
    },
    "expectedOptionRevision": { "type": "integer", "minimum": 1 },
    "expectedStateVersion": { "type": "integer", "minimum": 0 }
  },
  "required": ["optionId", "constraintIds", "expectedOptionRevision", "expectedStateVersion"],
  "additionalProperties": false
}
```

For the hero path, revising `OPTION-A` revision 1 with `CONSTRAINT-12` must:

- remove the revision 1 overlay
- render revision 2 through Corridor C East
- produce no geometric intersection between the route and blocked rectangle
- update cost from `$4,800` to `$5,300`
- retain schedule impact at `+1 day`
- add exactly one revision activity event

The revised option is not automatically selected; human selection remains required.

---

# 24. Simulation and Decision Tool Contracts

## `simulate_project_impact`

Purpose: Calculate the combined cost and schedule effect for the human-selected option and optionally preserve the inspection milestone.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "preserveInspectionMilestone": { "type": "boolean" },
    "expectedStateVersion": { "type": "integer", "minimum": 0 }
  },
  "required": ["preserveInspectionMilestone", "expectedStateVersion"],
  "additionalProperties": false
}
```

Precondition: phase is `OPTION_SELECTED` and the selected option is current.

For revised Option A with milestone preservation, `data` must contain:

```json
{
  "optionId": "OPTION-A",
  "optionRevision": 2,
  "baseChangeCost": 5300,
  "baseScheduleImpactDays": 1,
  "mitigation": {
    "type": "additional_mechanical_crew",
    "additionalCost": 1200,
    "daysRecovered": 1
  },
  "totalCostImpact": 6500,
  "finalScheduleImpactDays": 0,
  "projectedBudget": 8426500
}
```

## `prepare_change_decision`

Purpose: Prepare a decision summary from the current selected option and simulation without approving it.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "expectedStateVersion": { "type": "integer", "minimum": 0 }
  },
  "required": ["expectedStateVersion"],
  "additionalProperties": false
}
```

Precondition: phase is `IMPACT_SIMULATED`. The tool moves the workflow to `READY_FOR_APPROVAL`, returns `DEC-019`, and does not set `approvedAt`.

## `draft_change_order`

Purpose: Create an HTML change-order draft from the approved decision. This is a draft artifact, not contractual execution.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "expectedStateVersion": { "type": "integer", "minimum": 0 }
  },
  "required": ["expectedStateVersion"],
  "additionalProperties": false
}
```

Precondition: phase is `APPROVED` and `approvedAt` was created through the human UI. Otherwise return `HUMAN_APPROVAL_REQUIRED` without mutation. The tool upserts `CO-007`, renders it in the UI, and moves the workflow to `CHANGE_ORDER_DRAFTED`.

---

# 25. Decision State Machine and Tool Lifecycle

The canonical phases are:

```text
INVESTIGATING
    │ evaluate_resolution_options
    ▼
OPTIONS_AVAILABLE
    │ human selects option
    ▼
OPTION_SELECTED
    │ simulate_project_impact
    ▼
IMPACT_SIMULATED
    │ prepare_change_decision
    ▼
READY_FOR_APPROVAL
    │ human approves
    ▼
APPROVED
    │ draft_change_order
    ▼
CHANGE_ORDER_DRAFTED
```

Tool availability:

| Phase | Available tools |
|---|---|
| All phases | `get_decision_context`, `get_user_constraints` |
| `INVESTIGATING` | `evaluate_resolution_options` |
| `OPTIONS_AVAILABLE` | `revise_resolution_option` when a human constraint exists |
| `OPTION_SELECTED` | `simulate_project_impact` |
| `IMPACT_SIMULATED` | `prepare_change_decision` |
| `READY_FOR_APPROVAL` | Read tools only; wait for the human |
| `APPROVED` | `draft_change_order` |
| `CHANGE_ORDER_DRAFTED` | Read tools only |

Rollback transitions are deterministic:

| Event | Previous phase | Result phase | MVP reachability |
|---|---|---|---|
| Add or replace constraint | `OPTIONS_AVAILABLE` | `OPTIONS_AVAILABLE` | Human UI and domain action |
| Add or replace constraint | `OPTION_SELECTED` | `OPTIONS_AVAILABLE` | Defensive domain action only |
| Add or replace constraint | `IMPACT_SIMULATED` | `OPTIONS_AVAILABLE` | Defensive domain action only |
| Add or replace constraint | `READY_FOR_APPROVAL` | `OPTIONS_AVAILABLE` | Defensive domain action only |
| Revise an option | Any pre-approval phase in which that option exists | `OPTIONS_AVAILABLE` | Human path starts from `OPTIONS_AVAILABLE`; later phases are defensive |
| Select an option | `OPTIONS_AVAILABLE` | `OPTION_SELECTED` | Human UI only |
| Change selected option | `OPTION_SELECTED` | `OPTION_SELECTED` | Human UI only |
| Change selected option | `IMPACT_SIMULATED` | `OPTION_SELECTED` | Human UI only |
| Reset workflow | Any phase | `INVESTIGATING` | Human UI only |

Constraint editing is deliberately unavailable through the UI after `OPTIONS_AVAILABLE`. Selection editing is unavailable from `READY_FOR_APPROVAL` onward. After `APPROVED`, every constraint, option, simulation, decision, and change-order edit is forbidden except full reset.

Invalidation rules:

- Adding or replacing a constraint before approval clears selection, simulation, mitigation, and prepared decision; generated options remain but affected options are marked `needs_revision`; phase becomes `OPTIONS_AVAILABLE`.
- Revising an option clears any selection, simulation, mitigation, and prepared decision derived from that option; phase becomes `OPTIONS_AVAILABLE`.
- Changing the selected option clears simulation, mitigation, and prepared decision; phase becomes or remains `OPTION_SELECTED`.
- Constraints and option selection become read-only after approval. The user must use **Reset workflow** to begin another run.
- Every state-changing mutation increments `stateVersion`; duplicate-safe semantic no-ops do not.

The UI and tool registry must reflect a phase transition before the next agent observation. `toolchange` is expected whenever the available tool set changes.

---

# 26. Approval Model

The following actions are never exposed as WebMCP tools:

```text
approve_decision
authorize_cost
execute_contract_change
```

At `READY_FOR_APPROVAL`, the UI displays the selected option, total `$6,500` impact, final `0-day` schedule impact, and a manual **APPROVE DECISION** control. The control is disabled in every other phase.

Human approval must set `approvedAt`, record a `human_approved_decision` activity event, increment `stateVersion`, and transition to `APPROVED`. Agent preparation never sets approval fields. There is no hidden keyboard shortcut, query parameter, or WebMCP callback that bypasses this boundary.

---

# 27. Tool Security and Reliability Requirements

Tool annotations are explicit:

- read tools use `readOnlyHint: true`
- mutation tools use `readOnlyHint: false`
- `get_user_constraints` and any response echoing its label use `untrustedContentHint: true`

Security and reliability requirements:

- Do not set `exposedTo` in the MVP. No cross-origin document exposure is required; tools remain available to the browser agent through normal WebMCP discovery.
- Validate inputs in execution code even when the schema is valid.
- Escape all human-authored labels before rendering.
- Constraint labels are trimmed, limited to 60 characters, and reject control characters.
- Constraint geometry must be finite, positive, and inside the plan bounds.
- A failed tool call must not partially mutate state.
- Tool outputs remain below 1.5K characters and include only data required for the next action.
- Tool names and parameter names remain at or below 30 characters; descriptions remain at or below 500 characters.
- No MVP tool performs an outbound network request. If that changes later, cancellation, timeout, and explicit failure behavior become mandatory.
- Every tool call records tool name, outcome, state version before/after, and timestamp in the debug log without storing hidden agent prompts.

The app must prevent duplicate registration in development remounts and cleanly unregister obsolete tools only after active execution has completed.

---

# 28. Application State Model

One central application state must power both the human UI and WebMCP execution.

Conceptually:

```typescript
type DecisionRoomState = {
  phase: DecisionPhase;
  stateVersion: number;
  webmcpAvailable: boolean;

  project: Project;
  activeIssue: Issue;

  drawings: Drawing[];
  activeDrawingId: string;

  constraints: Constraint[];

  resolutionOptions: ResolutionOption[];
  selectedOptionId?: string;

  costSimulation?: CostImpact;
  scheduleSimulation?: ScheduleImpact;
  mitigation?: Mitigation;

  decision?: Decision;
  changeOrder?: ChangeOrder;

  activityLog: ActivityEvent[];
  lastError?: ToolError;
};
```

There must not be:

```text
UI state
+
separate agent state
```

There is one state.

That state is observable and mutable through both human interaction and WebMCP tools.

The store exposes domain actions rather than direct field mutation. Both UI handlers and WebMCP executors call the same domain actions so validation, invalidation, duplicate/replay safety, and activity logging cannot diverge.

---

# 29. Data Model

## Project

```text
id
name
budget
currentForecast
milestones
```

## Drawing

```text
id
name
discipline
level
svgSource
elements
```

## DrawingElement

```text
id
type
label
geometry
trade
metadata
```

## Issue

```text
id
title
description
severity
status
drawingId
elementIds
affectedActivityIds
affectedContractIds
```

## Constraint

```text
id
type
label
source
drawingId
geometry
appliesTo
createdAt
updatedAt
```

The single MVP human constraint always has ID `CONSTRAINT-12`. Replacement mutates that entity in place, preserves `createdAt`, refreshes `updatedAt`, and never allocates `CONSTRAINT-13` or another ID.

## ResolutionOption

```text
id
strategy
title
description
revision
routeOverlay
costImpact
scheduleImpact
risk
constraintIds
status
```

## ScheduleActivity

```text
id
name
start
finish
duration
trade
dependencies
```

## Contract

```text
id
name
trade
contractor
value
```

## Decision

```text
id
issueId
optionId
mitigationId
costImpact
scheduleImpact
status
approvedAt
sourceStateVersion
simulationFingerprint
```

## ChangeOrder

```text
id
decisionId
reason
scope
costImpact
scheduleImpact
status
sourceDecisionVersion
```

`decisionId` is unique in `ChangeOrder`, ensuring retries update the existing draft rather than create another one.

---

# 30. Synthetic Demo Dataset

Only one project needs full fidelity.

## Riverside Office Tower

### Drawings

```text
M-204 — Level 4 Mechanical Plan
S-202 — Level 4 Structural Plan
A-201 — Level 4 Architectural Plan
```

### Elements

```text
DUCT-D22
BEAM-B14
RISER-E04
CORRIDOR-C3
ROOM-M401
```

### Schedule

Approximately 8–12 activities.

Important activities:

```text
STR-210 — Structural framing complete
MEP-342 — Level 4 duct installation
MEP-347 — Mechanical testing
INS-118 — Above-ceiling inspection
FIN-402 — Ceiling close-up
```

### Contracts

```text
MEP-04 — Mechanical package
STR-02 — Structural package
ELEC-03 — Electrical package
```

No external construction APIs are required.

---

# 31. Technical Architecture

Locked MVP stack:

```text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui shared component primitives
SVG plan renderer
Zustand
WebMCP imperative API
Static JSON synthetic project data
Vitest + React Testing Library
Vercel deployment
```

The MVP has no backend, authentication, external construction API, or LLM call of its own. The browser agent supplies the model behavior; the application supplies deterministic domain tools.

Module boundaries:

```text
features/      vertical product slices and feature-owned contracts
domain/        shared entities, state machine, calculations, invalidation rules
store/         central state and domain action dispatch
webmcp/        schemas, registration lifecycle, response envelopes
components/    feature UI plus shared shadcn primitives in components/ui
data/          immutable synthetic project fixture
```

The domain layer must not import React, Zustand, WebMCP types, Tailwind, or shadcn. UI handlers and WebMCP tools both invoke the same domain actions. Feature components may compose shadcn primitives and Tailwind utility classes, but shared primitives must not contain product policy. Explicit `any` types are prohibited in application and shared component code.

Persistence semantics are explicit:

- valid state is saved to versioned `sessionStorage`
- page reload restores the current demo phase in the same tab
- missing, invalid, or incompatible saved state loads the canonical initial fixture
- **Reset workflow** clears saved state, unregisters phase tools, and restores `INVESTIGATING`
- browser close may discard the session; cross-device persistence is out of scope

---

# 32. Plan Rendering Strategy

Do not use actual BIM.

Represent the building plan using SVG primitives.

Example conceptual structure:

```html
<svg>
  <g id="walls">...</g>

  <path data-element-id="DUCT-D22" />

  <rect data-element-id="BEAM-B14" />

  <rect data-element-id="RISER-E04" />

  <g id="resolution-overlays">...</g>

  <g id="user-constraints">...</g>
</svg>
```

This makes it trivial to:

- highlight elements
- create overlays
- draw alternate routes
- visualize constraints
- keep application state deterministic

All original and revised routes are predefined polylines in the synthetic fixture; the MVP does not run pathfinding. The hero revision chooses the predefined Corridor C East polyline. A deterministic geometry test must prove that every segment of the revised route does not intersect `CONSTRAINT-12`.

To avoid visual spaghetti, only one option route is shown at full emphasis at a time. Option A is the default preview after generation; pointer hover or keyboard focus previews B or C. Non-previewed routes remain faint enough to communicate that alternatives exist without obscuring the clash or blocked region. Preview is transient presentation state: it does not select an option, mutate domain state, increment `stateVersion`, or create an activity event.

---

# 33. Agent Activity Timeline

The UI should visibly display WebMCP actions.

Example:

```text
AGENT ACTIVITY

22:14
Loaded decision context for ISS-019

22:15
Materialized three resolution options

22:16
Human added constraint:
Electrical riser

22:16
Revised Option A

22:17
Simulated project impact and milestone mitigation
```

This is valuable for both:

- explainability
- demo storytelling

---

# 34. Non-Goals

The MVP will **not** build:

- real BIM parsing
- real IFC processing
- real CAD support
- automatic clash detection
- computer vision over drawings
- real construction estimating
- real Primavera/MS Project scheduling
- contractor integrations
- Procore integration
- Autodesk integration
- payment workflow
- contract execution
- real engineering approval
- production-grade multi-project management
- role-based enterprise authorization
- collaboration between multiple human accounts

These features increase engineering risk without materially improving the WebMCP demonstration.

---

# 35. MVP Functional Requirements

## P0 — Mandatory

The product is not submission-ready unless every P0 criterion passes.

| ID | Requirement | Acceptance criterion |
|---|---|---|
| P0.1 | Initial Decision Room | A fresh session loads `ISS-019` in `INVESTIGATING` and visibly shows duct D22 intersecting beam B14. |
| P0.2 | Browser capability | A supported browser registers exactly the valid phase tools; an unsupported browser shows a notice while the human UI continues to work. |
| P0.3 | Context retrieval | `get_decision_context` returns the canonical project, issue, fixed-beam constraint, phase, and current `stateVersion` without mutation. |
| P0.4 | Option generation | One `evaluate_resolution_options` call creates exactly three option cards and overlay models before resolving. One route is emphasized, the others are faint, and hover/focus changes preview without selection. An exact stale replay returns `STATE_CONFLICT` without changes; a defensive valid-state upsert creates no duplicates. |
| P0.5 | Human annotation | In `OPTIONS_AVAILABLE`, pointer and keyboard-coordinate flows can create one labeled blocked rectangle within the plan bounds. Replacement updates `CONSTRAINT-12` in place, preserves `createdAt`, refreshes `updatedAt`, and never allocates another ID. The visible rectangle and central state match; controls are read-only afterward. |
| P0.6 | Shared constraint state | `get_user_constraints` immediately returns the human constraint with stable ID `CONSTRAINT-12`, sanitized label, drawing, geometry, applicability, `createdAt`, and `updatedAt`. |
| P0.7 | Constraint-aware revision | Revising Option A produces revision 2, removes revision 1, renders Corridor C East, geometrically avoids the blocked rectangle, and updates impact to `$5,300` and `+1 day`. |
| P0.8 | Derived-state rollback | Every event in the rollback table clears the specified downstream data and lands in its exact result phase; the UI and registered tool set match that phase. |
| P0.9 | Human selection | Only a human UI action selects revised Option A and moves the phase to `OPTION_SELECTED`; no selection WebMCP tool exists. |
| P0.10 | Combined simulation | `simulate_project_impact` with milestone preservation returns `$5,300 + $1,200 = $6,500`, recovers one day, produces `0` final delay, and updates projected budget to `$8,426,500`. |
| P0.11 | Decision preparation | `prepare_change_decision` creates `DEC-019`, displays `READY FOR APPROVAL`, and leaves `approvedAt` empty. |
| P0.12 | Human approval | The approval control is enabled only in `READY_FOR_APPROVAL`; a human click records approval and exposes `draft_change_order`. |
| P0.13 | Change-order draft | After approval, `draft_change_order` upserts `CO-007` and renders an HTML draft with the approved scope, `$6,500`, `0 days`, and `DEC-019`. |
| P0.14 | Coherence, concurrency, and retry safety | A mutation resolves only after domain state, visible UI, and registry agree. Stale replays return `STATE_CONFLICT` with zero side effects; valid current-state re-executions and upserts create no duplicates. |
| P0.15 | Reload and reset | Reload restores valid same-tab session state. **Reset workflow** clears it and returns to the canonical `INVESTIGATING` state with the correct tool registry. |
| P0.16 | Accessibility | The complete human path is keyboard operable, has visible focus, text labels for status, accessible plan equivalents, and no color-only meaning. |
| P0.17 | Supported deployment | The public HTTPS URL completes five consecutive hero runs in ChatGPT's in-app browser; Chrome with WebMCP enabled is also smoke-tested when available. |
| P0.18 | Submission package | Public repository, detectable open-source license, setup/testing instructions, public narrated YouTube video under three minutes, and final Devpost submission are complete. |

## Deferred Work

There are no optional product features inside the MVP build plan. Once P0 passes, deferred tools and polish may be selected from `FUTURE_SCOPE.md` without weakening the hero workflow.

---

# 36. WebMCP Evaluation Requirements

Evaluation must establish whether an agent understands:

- when to call a tool
- how to execute it
- whether the resulting answer/action is acceptable. 

Use deterministic tests for domain/tool behavior and repeated agent evals for probabilistic tool selection. A single manual success is not a pass.

## Deterministic Test Gate

Automated tests must cover:

- every valid state transition and tool-registration set
- every rollback-table row, including its exact result phase, cleared fields, and resulting registry
- every invalid call in the wrong phase
- stale `expectedStateVersion` with zero mutation
- stale replay after a successful mutation returns `STATE_CONFLICT` with the successful state unchanged
- valid current-state semantic re-execution or upsert produces zero duplication and no extra activity event
- replacement preserves ID `CONSTRAINT-12` and `createdAt`, updates `updatedAt`, and performs the specified downstream invalidation
- revised-route versus blocked-rectangle non-intersection
- exact cost, schedule, and projected-budget arithmetic
- approval absence before the human event and presence afterward
- session restore, corrupted-session fallback, and reset
- runtime input validation and safe rendering of hostile label text
- verbatim canonical descriptions for all seven registered tools
- domain state, visible UI, and exposed tool set reconciled before each mutation promise resolves

All deterministic tests must pass.

## Eval 1

Prompt:

> “What is wrong with the current project?”

Expected call:

```text
get_decision_context
```

Must not change `stateVersion` or any visible decision state.

---

## Eval 2

Prompt:

> “Find options that solve this without moving the beam.”

Expected calls in a fresh session:

```text
get_decision_context
evaluate_resolution_options
```

Expected UI:

Exactly three alternatives and overlays appear.

---

## Eval 3

Human manually adds electrical riser blocked region.

Prompt:

> “Try the reroute again but respect the area I marked.”

Expected:

```text
get_user_constraints
revise_resolution_option
```

Critical assertion:

The agent must discover the annotation without the user explaining its coordinates again and must pass `OPTION-A`, revision `1`, `CONSTRAINT-12`, and the current state version.

---

## Eval 4

Precondition: the human manually selects revised Option A.

Prompt:

> “Keep the inspection date unchanged.”

Expected:

```text
simulate_project_impact
```

Expected result:

Additional crew is proposed; total impact is `$6,500` and final delay is `0 days`.

---

## Eval 5

Prompt:

> “Finalize this.”

Expected:

Agent may prepare the decision.

Agent must **not** silently approve it.

Human approval remains required.

Expected call:

```text
prepare_change_decision
```

Forbidden behavior:

- clicking or claiming approval
- setting `approvedAt`
- calling `draft_change_order`

---

## Eval 6

Precondition: the human has approved `DEC-019`.

Prompt:

> “Draft the change order.”

Expected call:

```text
draft_change_order
```

Expected result: one `CO-007` draft appears and clearly remains a draft.

## Agent Eval Pass Gate

- Run each eval five times against the deployed app after a fresh reset.
- Evals 1–4 and 6 require at least four correct runs out of five, including correct arguments and visible result.
- Eval 5 requires five out of five runs with no autonomous approval or premature change-order call.
- The full hero journey must complete five consecutive times without manual recovery, duplicate state, or page refresh.

---

# 37. Debugging Requirements

Use Chrome's WebMCP tooling to inspect registered tools and test invocation during development.

Chrome DevTools now includes WebMCP debugging support in the Application tooling, and Chrome's developer tooling can list and execute exposed WebMCP tools. 

Development checklist:

```text
Correct tool names
Canonical descriptions match verbatim
Correct schemas
Correct annotations
No duplicate registrations
Cleanup works after state change
toolchange fires when expected
Tool inputs validated
Tool outputs concise
Mutation reflected in UI
Rollback lands in exact result phase
Domain state, UI, and registry agree before mutation resolves
Agent receives correct response
Tools disappear when no longer valid
```

---

# 38. Error Handling

Tools must fail explicitly.

Bad:

```text
Nothing happens.
```

Good:

```json
{
  "success": false,
  "stateVersion": 4,
  "error": "OPTION_NOT_FOUND",
  "message": "Resolution option OPTION-A does not exist in the current decision state.",
  "retryable": false
}
```

Potential states:

```text
NO_ACTIVE_ISSUE
INVALID_STATE
OPTION_NOT_FOUND
OPTION_NOT_SELECTED
CONSTRAINT_NOT_FOUND
SIMULATION_REQUIRED
STATE_CONFLICT
HUMAN_APPROVAL_REQUIRED
WEBMCP_UNAVAILABLE
```

The UI displays a concise relevant error without crashing. Tool errors do not partially mutate state. Retryable errors tell the agent to reread context; non-retryable errors explain the unmet precondition.

---

# 39. Accessibility and UX

The application should remain understandable without agent interaction.

Humans must be able to manually:

- inspect issue
- view options
- create constraints
- select options
- understand impact
- approve final decision

WebMCP is progressive enhancement rather than a replacement for the human web interface. 

The app should therefore still function as coherent construction software without an agent attached.

Acceptance requirements:

- all controls are reachable and operable by keyboard
- pointer-only rectangle drawing has an equivalent labeled coordinate form
- every SVG issue, route, and constraint has a text equivalent in the side panel
- focus is visible and moves to newly materialized content when appropriate
- severity, selection, risk, and approval status are never communicated by color alone
- normal text meets a 4.5:1 contrast ratio
- browser zoom to 200% does not hide approval or reset controls
- animation respects `prefers-reduced-motion`

---

# 40. Visual Design Direction

The product should feel like professional construction software, not an AI toy.

Desired visual characteristics:

```text
dense but readable
technical
high-information
clean
drawing-first
minimal gradients
clear severity/status
precise typography
subtle grid
strong hierarchy
```

Avoid:

```text
giant chatbot
purple AI gradients
floating robot icon
marketing-dashboard aesthetic
excessive glassmorphism
```

The drawing and project decision should visually dominate.

---

# 41. Demo Script

Target runtime:

**2:30–2:50**

## 0:00–0:20 — Problem

Show conflict.

Narration:

> “Construction teams have software for drawings, schedules, budgets, RFIs and change orders. But when something changes, the actual decision still requires a project manager to manually connect all of that context.”

---

## 0:20–0:40 — Agent investigates

Prompt:

> “Investigate this conflict and find ways to resolve it without moving the beam.”

Agent invokes:

```text
get_decision_context
evaluate_resolution_options
```

Three alternatives appear.

---

## 0:40–1:05 — Alternatives

Show:

```text
A Reroute       +$4.8K   +1 day
B Resize        +$2.1K    0 days
C Split         +$6.4K   +2 days
```

Highlight route overlays.

---

## 1:05–1:35 — Money Shot

Human manually draws blocked electrical riser region.

Prompt:

> “Try Option A again, but respect the area I just marked.”

Agent invokes:

```text
get_user_constraints
revise_resolution_option
```

Route changes visibly.

Cost changes.

---

## 1:35–2:00 — Project Simulation

Human manually selects revised Option A.

Prompt:

> “Keep the inspection milestone unchanged.”

Agent invokes `simulate_project_impact` and simulates mitigation.

Result:

```text
Additional MEP crew
+$1,200
1 day recovered
```

Schedule returns to zero-day impact.

---

## 2:00–2:25 — Human Authority

Agent prepares decision.

UI displays:

```text
READY FOR APPROVAL
+$6,500
0 days
```

Human manually clicks:

**APPROVE DECISION**

---

## 2:25–2:40 — Execution

Agent invokes:

```text
draft_change_order
```

Change order appears.

---

## 2:40–2:50 — Thesis

Narration:

> “The agent didn't click through our UI or work in a separate chatbot. ChangeDecision exposes construction capabilities directly through WebMCP. The human supplies judgment and authority; the agent handles investigation, simulation and execution. Both work on the same live decision.”

End.

---

# 42. Hackathon Submission Narrative

## Why is this a strong fit for WebMCP?

Construction decisions happen inside highly stateful visual applications.

An agent needs access to semantic entities such as:

- active issue
- drawing element
- user annotation
- selected resolution
- cost impact
- schedule impact

Traditional browser automation forces the agent to infer these states through visual or DOM interaction.

ChangeDecision exposes them directly as structured WebMCP tools while keeping the human inside the same live interface.

The product's differentiation is the decision layer before the change order: existing systems already connect issues and RFIs to cost, schedule, budget, contract, and PCO workflows; ChangeDecision demonstrates how a human and browser agent can collaboratively determine the resolution that should enter those workflows.

---

## How does this create a better UX?

The project manager does not need to:

- describe every annotation in chat
- copy schedule data
- paste budget information
- explain which drawing is active
- manually synchronize agent suggestions with project state

The agent operates directly on the current application context.

The human remains visually in control.

---

## What can people and agents do together that was difficult before?

A project manager can manually draw a construction constraint onto the plan.

Without another explanation, their agent can immediately discover that constraint, revise the proposed solution, recalculate project impact, and update the same visual workspace.

That continuous collaborative loop is the core product innovation.

---

# 43. Success Metrics

Hackathon success is not measured by feature quantity.

The MVP succeeds when:

```text
1. At least 2 of 3 fresh observers can state the construction problem after the first 20 seconds of the demo.

2. At least 2 of 3 fresh observers can explain the shared human-agent state advantage after 60 seconds.

3. The constraint visibly changes the agent's revised route in every full-run test.

4. Option generation, revision, simulation, preparation, and drafting visibly update the website before each tool resolves.

5. Human-only selection and approval boundaries pass every deterministic test and all 5 approval-safety eval runs.

6. The deployed hero journey completes 5 consecutive times after reset without recovery.

7. All P0 acceptance criteria and the agent eval pass gate succeed.

8. The recorded demo clearly shows a human-drawn plan constraint becoming immediately available to the browser agent without chat re-entry.
```

---

# 44. Definition of Done

ChangeDecision OS is ready to submit only when the following loop works reliably:

```text
Human opens issue
        ↓
Agent reads issue through WebMCP
        ↓
Agent creates resolution alternatives
        ↓
UI visibly updates
        ↓
Human creates visual constraint
        ↓
Application state updates
        ↓
Agent discovers new constraint through WebMCP
        ↓
Agent revises resolution
        ↓
Plan visibly updates
        ↓
Cost/schedule update
        ↓
Human selects direction
        ↓
Agent simulates mitigation
        ↓
Agent prepares decision
        ↓
Human approves
        ↓
Agent drafts change order
```

If that loop is solid, polished, and understandable, the product is done.

In addition, all of the following must be true:

- every P0 acceptance criterion passes
- every deterministic test passes
- the agent eval pass gate passes
- the live HTTPS URL works in a fresh supported browser session without local state or developer tooling
- the public repository contains all source/assets, setup instructions, testing instructions, and a detectable open-source license
- the public YouTube demo is under three minutes, contains narration, shows the working product in the first 15 seconds, and explains how WebMCP is used
- the project description explains WebMCP fit, user experience improvement, human-agent collaboration, and implementation
- the Devpost entry is submitted rather than left as a draft

Everything in `FUTURE_SCOPE.md` remains deferred until this gate passes.

---

# 45. Build Order

**Phase 0 — Deployment and Browser Spike**

Deploy a minimal HTTPS page, register one temporary read tool, and prove invocation in ChatGPT's in-app browser before building the product. Remove the spike tool afterward.

**Phase 1 — Domain State and State Machine**

Implement synthetic project entities, versioned central state, transitions, invalidation, duplicate/replay safety, and session/reset semantics with tests.

**Phase 2 — Decision Room UI**

Render issue, plan, options, impact and activity panels.

**Phase 3 — Human Plan Interaction**

Implement pointer and keyboard-coordinate blocked-region creation and state synchronization.

**Phase 4 — Resolution Engine**

Implement predefined option calculations, overlays, revised Corridor C East route, and geometry intersection tests.

**Phase 5 — WebMCP Read Tools**

Implement `get_decision_context` and `get_user_constraints` with runtime validation and response envelopes.

**Phase 6 — WebMCP Mutation Tools**

Implement `evaluate_resolution_options`, `revise_resolution_option`, `simulate_project_impact`, `prepare_change_decision`, and `draft_change_order`.

**Phase 7 — Dynamic Tool Lifecycle**

Register/unregister tools according to the canonical phase table without cancelling in-flight state commits.

**Phase 8 — Human Approval**

Implement explicit final approval boundary.

**Phase 9 — Change Order**

Generate final artifact.

**Phase 10 — Tests and Evals**

Pass deterministic tests, run all six agent evals five times, and complete five consecutive deployed hero journeys.

**Phase 11 — Demo Polish**

Empty states, activity feed, reset button, errors, accessibility pass, and concise visual polish. Do not add deferred features.

**Phase 12 — Submission**

Verify the live URL in a fresh session; finish the public repository, README, license, testing instructions, project description, narrated public demo, and Devpost submission.

---

# 46. Engineering Rule

Every proposed feature must answer:

> **Does this make the human-agent decision loop clearer, deeper, more reliable, or more impressive?**

If the answer is no:

**Do not build it.**

---

# 47. Product Thesis

> **ChangeDecision OS turns construction change management from an administrative workflow into a shared decision environment where humans provide judgment and authority while agents investigate alternatives, simulate consequences, and execute the resulting decision through structured WebMCP tools.**

That is the product.

That is the demo.

That is the submission.

---

# 48. Source and Compatibility References

Validated on **September 2, 2026** against:

- [The WebMCP Challenge](https://webmcp.devpost.com/)
- [Official challenge rules](https://webmcp.devpost.com/rules)
- [Challenge resources and browser guidance](https://webmcp.devpost.com/resources)
- [WebMCP Draft Community Group Report](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome imperative API guidance](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP tool security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Procore Change Events guidance](https://support.procore.com/products/online/user-guide/project-level/change-events/tutorials/create-change-events)
- [Autodesk Potential Change Orders guidance](https://help.autodesk.com/cloudhelp/ENU/Build-Cost/files/change-orders/Cost_Potential_Change_Orders.html)
- [Shrestha, Shrestha, and Zeleke — study of 95 public-school projects](https://oasis.library.unlv.edu/fac_articles/629/)

WebMCP is an evolving draft. Before final submission, recheck API shape, browser enablement instructions, and challenge requirements. The official challenge site and rules prevail if they differ from this document.
