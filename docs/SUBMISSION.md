# ChangeFrame — Submission Draft

## One-line pitch

ChangeFrame lets a browser agent turn any live construction problem into original, inspectable decision alternatives while humans retain control of constraints, selection and approval.

## What makes it different

Most agent demos hide reasoning in chat or replay a prewritten happy path. ChangeFrame starts with one polished, replaceable project context but no answers. The judge can use that project immediately or describe a new conflict during the demo. The browser agent creates original alternatives with assumptions and confidence and draws routes directly into the shared decision room.

When the human marks a field constraint, ChangeFrame detects every intersecting route. The agent must observe that state change and author a new revision. The app rejects geometry that still violates the constraint. This creates a visible perceive–reason–act–observe loop rather than a scripted sequence.

## Suggested demo

1. Open the Riverside Office Tower starter project and emphasize that the context is ready but no resolution is stored or preselected.
2. Ask the agent for original alternatives immediately, or give it a construction issue that is not stored in the repository.
3. For the unseen brief, watch `configure_decision_context` replace the project, drawing, issue, schedule and contracts.
4. Ask for multiple alternatives and compare their original rationales, assumptions and confidence.
5. Draw a blocked region across one route.
6. Ask the agent to inspect and revise it; show the geometry validator rejecting a deliberately invalid revision if time permits.
7. Select an eligible alternative yourself.
8. Ask the agent for a mitigation and impact calculation.
9. Ask it to approve; demonstrate that no approval tool exists.
10. Approve in the UI, then let the agent create a draft change order.

## Safety story

The agent proposes; ChangeFrame verifies; the human authorizes. Agent-generated estimates never become hidden facts. Rationale, assumptions, confidence, geometry and state provenance remain inspectable. No tool can sign, issue, authorize or execute a contractual change.
