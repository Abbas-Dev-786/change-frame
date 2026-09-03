# Title

ChangeFrame

## One-line Summary

A WebMCP decision room where humans set constraints and approve outcomes while agents evaluate options, simulate impact, and draft the change.

## Problem

Construction change management is good at recording what happened, but the hard decision usually comes first. When a field conflict appears, project teams must combine visual plan context, constructability constraints, cost, schedule, risk, and approval authority before a downstream change order can be created.

Today, that context is fragmented across drawings, issue records, spreadsheets, specialist knowledge, and conversation. A general-purpose agent can suggest an answer, but it cannot reliably understand the application's current decision phase or act on the same live state without brittle screen automation or repeated copy-and-paste from the project manager.

## Solution

ChangeFrame is a WebMCP-native construction decision workspace in which a project manager and a browser agent resolve a field coordination conflict together.

The app opens with a credible but replaceable HVAC duct D22 conflict with structural beam B14 at Riverside Office Tower. No resolution options or expected answer are stored. The agent reads the active issue and authors original resolution strategies with rationale, assumptions, confidence, estimates, and optional route geometry. It reacts to a human-drawn blocked region, revises the affected route, and proposes an optional mitigation while ChangeFrame performs the impact arithmetic. It can prepare a decision for review, but the project manager alone selects the preferred option and approves the outcome. Only after that explicit approval does ChangeFrame expose the tool that lets the agent draft a change order.

This is not a chatbot placed beside an existing UI. The human and agent operate on the same versioned application state, and every agent action visibly updates the same decision room the human is reviewing.

## Why This Matters

ChangeFrame focuses on the decision interval between “a problem was discovered” and “a change should be formally administered.” That interval is high-context and high-consequence: the team must explore alternatives quickly without losing human judgment, traceability, or approval control.

WebMCP is a strong fit because the information an agent needs is semantic and stateful: the active issue, human annotations, available resolutions, selected option, impact simulation, approval phase, and current state version. Without WebMCP, the human must restate that context in chat or the agent must infer it through visual or DOM interaction. With WebMCP, the page exposes explicit, typed construction capabilities through `document.modelContext.registerTool()`.

The resulting user experience removes context handoffs. A project manager can draw a field constraint directly on the plan; without another explanation, the agent can discover it, revise a route around it, recalculate project impact, and update the same visible workspace. The human stays in control of judgment and authority while the agent handles structured investigation, computation, and drafting.

What people and agents can now do together:

- The human contributes visual field knowledge in the interface while the agent consumes it immediately as structured data.
- The agent explores and calculates alternatives while the human compares, rejects, and selects them.
- The agent prepares a complete decision record while the human retains the only approval path.
- After approval, the agent drafts the downstream artifact without gaining authority to sign or execute it.
- Both can see an auditable timeline of human actions, agent calls, capability changes, and state versions.

## How We Used AI

The browser agent is a participant in the product workflow rather than a hidden backend service. It discovers and invokes the tools that ChangeFrame exposes for the current decision phase, interprets the structured results, and decides which valid capability to use next.

WebMCP turns the page into a reliable agent surface. ChangeFrame registers eight domain-level tools: two read tools for decision context and human constraints, plus six phase-gated mutation tools for configuring or replacing project context, authoring options, revising a route, simulating impact, preparing a decision, and drafting the approved change order.

The tool set changes as the decision advances. Selection, rejection, and approval are intentionally never exposed to the agent. This demonstrates an AI collaboration model in which capability is dynamic, authority is explicit, and the browser application remains the shared source of truth.

## How We Used Codex

Codex helped shape the project from product scope through production hardening. It was used to pressure-test the WebMCP use case against the judging criteria, turn the concept into a detailed PRD, define the domain state machine and human-authority boundaries, implement the React and TypeScript application, and build the deterministic test matrix.

During iteration, Codex also helped identify and fix lifecycle and concurrency risks: stale mutations now fail with zero side effects, valid retries do not duplicate artifacts, WebMCP registrations are reconciled without page reloads, and mutation results wait until domain state, visible UI state, and the tool registry are coherent. It also supported accessibility, responsive design, CI, browser-level tests, documentation, and the submission narrative.

## Key Features

- Interactive plan with pointer and keyboard-coordinate constraint creation
- One credible, replaceable starter project with no predetermined answer
- Two to five original agent-authored resolution options with route overlays and revision visualization
- Side-by-side cost, schedule, risk, and constraint comparison
- Project-impact simulation with inspection-milestone mitigation
- Human-only option rejection, selection, and final approval
- Eight typed WebMCP tools with phase-based dynamic availability
- Optimistic concurrency through `expectedStateVersion` and side-effect-free conflicts
- Agent Flight Recorder with redacted tool spans, actor attribution, and capability transitions
- Graceful non-WebMCP fallback for the complete human interface
- Responsive and accessible React UI

## Architecture

ChangeFrame is a frontend-only modular monolith built with React, TypeScript, Vite, Zustand, Tailwind CSS, and shadcn/ui. A pure domain state machine owns every decision transition. The human UI and WebMCP executors call the same domain actions, preventing business rules and visible state from diverging.

The imperative WebMCP integration registers tools through `document.modelContext.registerTool()`. Each registration has an `AbortController`; obsolete phase-specific tools are aborted and the valid tool set is reconciled asynchronously without reloading the document. Runtime guards reject malformed inputs, mutation calls require the expected state version, and the application waits for state, UI, and registry coherence before returning success.

No backend is required for the hackathon scenario. Versioned state is saved in same-tab session storage, while the Flight Recorder remains session-only observability data.

## Testing Instructions

1. Open the live app in ChatGPT's in-app browser or Google Chrome with WebMCP enabled.
2. Begin a reset session and ask the agent to inspect the Riverside starter project and author three materially different options.
3. Draw a blocked region on the plan, then ask the agent to discover it and revise the affected option.
4. Select an eligible revised option manually.
5. Ask the agent to propose a mitigation, calculate impact, and prepare the decision.
6. Verify that the UI reflects the selected agent-authored estimates and reports `READY_FOR_APPROVAL`.
7. Ask the agent to approve the decision; verify it refuses because approval is human-only.
8. Click **Approve decision**, then ask the agent to draft the change order.
9. Verify a change order derived from the live issue ID appears and is clearly labeled as a draft.

Local verification:

```bash
npm install
npm run verify
npx playwright install chromium
npm run verify:all
```

## Public Demo Link

https://change-frame.vercel.app

## Public Repository Link

https://github.com/Abbas-Dev-786/change-decision-os

The repository contains a complete root-level MIT `LICENSE` file so GitHub can detect and display the license in the repository About section.

## Demo Video

TODO: Add the public YouTube URL for a narrated video under three minutes.

The focused 1:45–1:55 narration, WebMCP prompts, screen actions, editing notes, and rehearsal checklist are in `docs/DEMO_VIDEO_SCRIPT.md`.

## Screenshot Shot List

- Decision Room with the active issue and initial plan
- Human blocked-region constraint with the agent-revised route
- Option comparison and simulated `+$6,500` / `0 days` impact
- Human-only approval boundary at `READY_FOR_APPROVAL`
- Draft `CO-007` beside the open Agent Flight Recorder

## Submission Readiness Notes

- Project title and Devpost draft have been renamed to ChangeFrame.
- Live application URL is available.
- Public repository URL is available.
- The repository includes a detectable MIT license file.
- The description explicitly covers WebMCP fit, user-experience improvement, human-agent collaboration, and implementation.
- The generic runtime project gate and Chromium WebMCP journeys are implemented.
- A public narrated demo video is still required.

## Known Limitations

- The hackathon build includes one synthetic starter project for immediate comprehension; it can be replaced at runtime and contains no resolution options or expected answer.
- It does not connect to Procore, Autodesk Construction Cloud, scheduling, estimating, or contract systems.
- It creates a draft change-order artifact only; it cannot sign, authorize, transmit, or execute a contract change.
- WebMCP agent interaction requires a compatible client, though the human interface remains functional in standard browsers.
- The MVP supports a single same-tab session and one stable field constraint.

## TODO Official Form Fields

- Confirm submitter type.
- Confirm country of residence for the submitter and any team members.
- Confirm whether Devpost should classify the app as New or Existing; if Existing, describe only the work completed during the submission period.
- Confirm which WebMCP agent/client was used for final live testing.
- Confirm the list of AI tools used during the project.
- Confirm the self-reported learning level and career-value answers.
- Add the public YouTube demo video URL.
