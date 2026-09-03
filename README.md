# ChangeFrame

> An open-ended WebMCP decision room where a browser agent turns live construction context into original, auditable alternatives—and humans retain approval authority.

[![Live Demo](https://img.shields.io/badge/live-demo-0f766e?style=for-the-badge)](https://change-frame.vercel.app)
[![WebMCP](https://img.shields.io/badge/WebMCP-native-2563eb?style=for-the-badge)](https://webmachinelearning.github.io/webmcp/)
[![License: MIT](https://img.shields.io/badge/license-MIT-f59e0b?style=for-the-badge)](./LICENSE)

**[Try the live app](https://change-frame.vercel.app)** · **[Architecture](./docs/ARCHITECTURE.md)** · **[Evals](./docs/EVALS.md)**

ChangeFrame boots into one credible, replaceable starter project so the product is immediately understandable, but it contains no canned resolution options or preferred answer. The browser agent can reason over that project or replace it with a new project brief, then author situation-specific alternatives with rationale, assumptions, confidence, cost and schedule estimates, risk, and optional route geometry.

The application is the verifier and shared workspace—not the source of the answer. It validates schemas, cross-references, state versions, geometry, arithmetic, and workflow permissions. The human draws constraints, rejects or selects alternatives, and remains the only actor that can approve a decision.

## Why WebMCP

The browser agent works against the same live decision state the project manager sees. It does not scrape cards or guess through the DOM. Tools appear only when their action is valid:

| Tool | Purpose |
| --- | --- |
| `get_decision_context` | Read the complete live context and current alternatives |
| `get_user_constraints` | Read human-authored field constraints |
| `configure_decision_context` | Structure an arbitrary user project brief into the workspace |
| `evaluate_resolution_options` | Submit 2–5 original alternatives with assumptions and confidence |
| `revise_resolution_option` | Submit a complete route revision that is geometry-checked |
| `simulate_project_impact` | Add an optional agent mitigation; ChangeFrame calculates the totals |
| `prepare_change_decision` | Prepare the selected result for human review |
| `draft_change_order` | Draft an artifact only after human approval |

There is deliberately no tool for selecting, rejecting, or approving an alternative.

## The collaboration loop

1. The user keeps the visible starter project or describes a different project issue to the browser agent.
2. For a different brief, the agent calls `configure_decision_context` with the facts, relationships, and plan geometry it has.
3. The agent reads the current state and authors original alternatives.
4. The human reviews the rationale and assumptions and draws a field constraint.
5. Any intersecting route is marked `needs_revision` automatically.
6. The agent reads that new constraint and submits a revised route.
7. ChangeFrame rejects the revision if the route still intersects the constraint.
8. The human selects an eligible alternative.
9. The agent may propose an evidence-backed mitigation; ChangeFrame performs the arithmetic.
10. The agent prepares the decision, the human approves it, and only then can a draft change order be created.

Every mutation carries `expectedStateVersion`. Stale calls fail without side effects. Agent inputs and capability changes are recorded in the Agent Flight Recorder.

## Run and verify

```bash
npm install
npm run dev
```

```bash
npm run verify
```

The complete browser lifecycle gate is:

```bash
npx playwright install chromium
npm run verify:all
```

## Demo prompt

Open the app in a WebMCP-capable browser. For the fastest demo, ask the agent to propose multiple distinct resolutions for the Riverside Office Tower starter issue. To prove generality, provide a project issue the app has not seen before and ask the agent to replace the starter context before proposing alternatives.

The strongest demonstration changes the brief between runs. The app should produce different alternatives because the agent is reasoning over different input—not because ChangeFrame contains scenario-specific branches.

## Safety boundary

Agent estimates are proposals, not engineering facts. Their assumptions and confidence remain visible. ChangeFrame validates structure and geometry but does not certify engineering adequacy. Approval, authorization, signature, issuance, and contract execution remain human-controlled and outside the agent tool registry.

## Project structure

```text
src/domain/decision/                   Generic entities, state machine, validation and geometry
src/store/                             Zustand adapter and session persistence
src/webmcp/                            Runtime schemas, guards, tools and capability registry
src/observability/                     Human, agent and registry flight-recorder events
src/features/decision-room/            Product hooks and presentation components
src/test/decision-fixture.ts            Deterministic data used only by automated tests
e2e/                                   Runtime-context browser journeys
docs/                                  Architecture, PRD, evals and submission copy
```

## License

MIT
