# ChangeFrame

> A WebMCP decision room where humans set constraints and approve outcomes while agents evaluate options, simulate impact, and draft the change.

[![Live Demo](https://img.shields.io/badge/live-demo-0f766e?style=for-the-badge)](https://change-frame.vercel.app)
[![WebMCP](https://img.shields.io/badge/WebMCP-native-2563eb?style=for-the-badge)](https://webmachinelearning.github.io/webmcp/)
[![CI](https://img.shields.io/github/actions/workflow/status/Abbas-Dev-786/change-decision-os/ci.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/Abbas-Dev-786/change-decision-os/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-f59e0b?style=for-the-badge)](./LICENSE)

**[Try the live app](https://change-frame.vercel.app)** · **[WebMCP Challenge](https://webmcp.devpost.com/)** · **[Architecture](./docs/ARCHITECTURE.md)** · **[Evals](./docs/EVALS.md)**

ChangeFrame is a WebMCP-native construction decision workspace. Its focused demo follows a real coordination problem at Riverside Office Tower: HVAC duct D22 conflicts with structural beam B14, and the project team must choose a safe resolution without losing control of cost, schedule, or approval.

The agent does not operate a separate chatbot or guess its way through the DOM. It discovers structured tools exposed by the page, reads the same versioned decision state the project manager sees, and updates that shared workspace. The human supplies field judgment, draws constraints, selects the preferred option, and retains sole approval authority.

## Why WebMCP fits this use case

Construction coordination is visual, stateful, and consequential. An agent needs more than page text: it needs the active issue, drawing constraints, available resolutions, the chosen option, cost and schedule impact, and the current approval phase.

Without WebMCP, the human would need to repeatedly translate that live application state into chat, or an agent would need to infer it through brittle click automation. ChangeFrame exposes those capabilities directly through `document.modelContext.registerTool()` with typed schemas and deterministic responses.

This creates a continuous collaboration loop that was difficult before:

1. The agent reads the active issue and generates three resolution options.
2. The human draws a blocked region directly on the plan.
3. The agent discovers that new constraint and revises the affected route.
4. The human compares the alternatives and selects the preferred option.
5. The agent simulates cost and schedule impact, then prepares the decision.
6. The human reviews and explicitly approves it.
7. Only then does the agent gain the ability to draft change order `CO-007`.

Both participants work on the same live decision. No copied context, hidden agent state, or approval-by-prompt is required.

## The human-agent boundary

ChangeFrame deliberately gives the agent capability without giving it authority.

| Human-only actions | Agent-enabled actions |
| --- | --- |
| Draw or replace the field constraint | Read the active issue and decision state |
| Reject or compare options | Generate supported resolution options |
| Select the preferred option | Revise a route around the human constraint |
| Approve the prepared decision | Simulate cost, schedule, and mitigation impact |
| Reset the workflow | Prepare the decision and draft the approved change order |

There is no WebMCP tool for selection, rejection, or approval. The final drafting tool is not registered until the human approves the decision in the UI.

## WebMCP implementation

ChangeFrame uses the imperative WebMCP API to expose seven domain-level tools:

| Tool | Availability | Purpose |
| --- | --- | --- |
| `get_decision_context` | Every phase | Read the issue, baseline constraints, phase, selection, and state version |
| `get_user_constraints` | Every phase | Read the current human-created plan constraint |
| `evaluate_resolution_options` | `INVESTIGATING` | Materialize three supported alternatives |
| `revise_resolution_option` | `OPTIONS_AVAILABLE` with a constraint | Route an option around the blocked region |
| `simulate_project_impact` | `OPTION_SELECTED` | Calculate cost, schedule, and milestone mitigation |
| `prepare_change_decision` | `IMPACT_SIMULATED` | Prepare the selected resolution for human approval |
| `draft_change_order` | `APPROVED` | Create a draft artifact from the human-approved decision |

Tool availability is part of the product model. As the workflow phase changes, the registry aborts obsolete registrations and reconciles the next valid tool set without reloading the page. Every mutation includes an `expectedStateVersion`; stale calls fail with `STATE_CONFLICT` and produce no side effects.

The human UI and every WebMCP executor call the same domain actions, so validation, invalidation, activity logging, and replay safety cannot diverge. Mutation responses wait until domain state, visible UI state, and the exposed tool registry agree.

## Product highlights

- Interactive SVG plan with pointer and keyboard-coordinate constraint creation
- Three deterministic construction-resolution strategies with visual route overlays
- Side-by-side comparison across cost, schedule, risk, constraint status, and decision notes
- Cost and schedule simulation with inspection-milestone mitigation
- Human-only rejection, selection, and approval controls
- Dynamic phase-based WebMCP capability registration
- Agent Flight Recorder with actor attribution, redacted inputs, capability transitions, and state-version provenance
- Versioned same-tab session persistence and one-click workflow reset
- Graceful fallback: the full human interface remains usable when WebMCP is unavailable
- Responsive, accessible interface built with Tailwind CSS and shadcn/ui primitives

## Architecture

ChangeFrame is a frontend-only modular monolith. A pure TypeScript domain state machine is the source of truth for both the React UI and WebMCP tools.

```text
Human UI ───────────────┐
                       ▼
                 Domain actions ──► Versioned decision state
                       ▲                       │
Browser agent ─► WebMCP registry              ├─► Visible React UI
                                               ├─► Dynamic tool set
                                               └─► Flight Recorder
```

The domain layer has no React, browser API, Zustand, or presentation dependencies. Zustand adapts domain actions to application state; feature hooks connect that state to the UI and WebMCP lifecycle.

See [the architecture document](./docs/ARCHITECTURE.md) for module boundaries and invariants.

## Run locally

### Prerequisites

- Node.js 22+
- npm
- A WebMCP-capable client for agent interaction; the human interface works in standard browsers

### Setup

```bash
git clone https://github.com/Abbas-Dev-786/change-decision-os.git
cd change-decision-os
npm install
npm run dev
```

Open the URL printed by Vite. To exercise WebMCP, use ChatGPT's in-app browser or a compatible Chrome build with WebMCP enabled.

The development, preview, and Vercel configurations send the headers required by the current browser implementation:

```text
Origin-Agent-Cluster: ?1
Permissions-Policy: tools=(self)
```

## Verify the project

Run the deterministic quality gate:

```bash
npm run verify
```

This checks the explicit-`any` prohibition, TypeScript, unit and integration tests, and the production build.

Run the complete gate, including real Chromium WebMCP lifecycle journeys:

```bash
npx playwright install chromium
npm run verify:all
```

The same complete gate runs in GitHub Actions for every pull request and push to `main`.

## Test the hero journey

Start with a fresh session, then ask the browser agent to inspect the Decision Room and generate the supported resolution options.

1. Draw a blocked region across the proposed route, or use the coordinate fields.
2. Ask the agent to read the constraint and revise the affected option.
3. Select revised `OPTION-A` in the UI.
4. Ask the agent to preserve the inspection milestone, simulate impact, and prepare the decision.
5. Confirm the result is `+$6,500` and `0 days` final schedule impact.
6. Ask the agent to approve the decision. It should explain that approval is human-only.
7. Click **Approve decision** yourself.
8. Ask the agent to draft the change order and confirm that `CO-007` appears.

Additional prompts and pass criteria are in [the eval plan](./docs/EVALS.md).

## Project structure

```text
src/domain/decision/                   Pure entities, geometry, and state-machine policy
src/store/                             Zustand adapter and session persistence
src/webmcp/                            Tool contracts, schemas, guards, and lifecycle registry
src/observability/                     Human, agent, and registry flight-recorder events
src/features/decision-room/            Product hooks and presentation components
components/ui/                         Shared shadcn/ui primitives
e2e/                                   Chromium WebMCP lifecycle journeys
docs/                                  PRD, architecture, evals, and submission notes
```

## Current scope

This hackathon build intentionally uses deterministic synthetic project data and a single decision scenario so the complete collaboration loop can be evaluated repeatedly. It drafts a change-order artifact; it does not sign, authorize, or send a contractual change, and it does not connect to a production construction system of record.

Planned extensions are separated in [future scope](./docs/FUTURE_SCOPE.md) so they are not presented as shipped features.

## License

ChangeFrame is open source under the [MIT License](./LICENSE). The complete license file is stored at the repository root so GitHub can detect and display it in the repository **About** section.
