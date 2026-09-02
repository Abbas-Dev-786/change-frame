# Submission Readiness

This is the local Phase 12 checklist. Deployment, public repository setup, video upload, and Devpost submission remain manual owner actions.

## Pre-deploy checklist

- Run `npm run verify`.
- Deploy the static build from `dist/`.
- Confirm the deployed host preserves these headers:
  - `Origin-Agent-Cluster: ?1`
  - `Permissions-Policy: tools=(self)`
- Open the deployed URL in a fresh WebMCP-capable browser session.
- Complete the five hero-journey repetitions in `docs/EVALS.md`.

## Repository checklist

- Repository is public.
- `README.md` explains setup, deployment, WebMCP headers, and verification.
- `LICENSE` is present.
- `docs/PRD.md`, `docs/FUTURE_SCOPE.md`, `docs/ARCHITECTURE.md`, and `docs/EVALS.md` are included.
- The codebase avoids explicit `any` types.

## Demo video outline

Suggested 90-second narration:

1. Show the active construction issue: HVAC duct D22 conflicts with beam B14.
2. Ask the agent to inspect context and evaluate three resolution options.
3. Create the human blocked-region constraint `CONSTRAINT-12`.
4. Ask the agent to revise the affected option and show the route avoiding the constraint.
5. Select revised `OPTION-A` as the human project manager.
6. Ask the agent to simulate cost and schedule impact while preserving inspection.
7. Ask the agent to prepare the decision, then point out that approval is human-only.
8. Click `Approve decision`.
9. Ask the agent to draft the change order and show `CO-007`.
10. Close by emphasizing dynamic tool availability, shared UI state, and no agent approval/execution authority.

## Devpost project description draft

ChangeDecision OS is a WebMCP-native construction decision workspace that lets an AI agent and a human project manager resolve a field coordination conflict together. The app models a realistic HVAC duct versus structural beam issue, exposes phase-specific WebMCP tools, and requires human-only selection and approval before the agent can draft a change order.

The key interaction is not a generic chatbot overlay. The agent reads the same decision room the human sees, materializes deterministic resolution options, reacts to a human-drawn plan constraint, simulates cost/schedule impact, prepares a decision record, and only after explicit human approval drafts `CO-007`. Tool availability changes as the state machine advances, so the agent cannot skip ahead or approve on the human's behalf.

## Final manual submission tasks

- Add deployed app URL.
- Add public repository URL.
- Add public demo video URL.
- Include a short note that synthetic project data is intentionally deterministic for eval repeatability.
- Confirm no deferred future-scope feature is presented as shipped.
