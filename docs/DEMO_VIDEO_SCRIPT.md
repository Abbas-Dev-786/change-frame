# ChangeFrame — Short WebMCP Demo Script

**Target runtime:** 1:45–1:55

**Core message:** The agent proposes. The app verifies. The human authorizes.

**Editing rule:** Show real results, but cut every wait.

## 0:00–0:10 — Hook

**On screen:** Start directly on the Riverside plan. Move the cursor over the duct and beam conflict.

**Narration:**

> One clash. Three trades. And a project waiting on a decision. Chat alone cannot solve this, because the critical context—and the authority to act—live inside the application.

**Caption:** `One decision · Shared live state`

## 0:10–0:24 — Reveal WebMCP

**On screen:** Open the Agent Flight Recorder. Briefly show `4 of 8 tools live`, then close it.

**Narration:**

> This is ChangeFrame. The page registers eight typed WebMCP tools, but only the capabilities valid right now are exposed. The agent reads the same versioned project state I see—without scraping the UI.

**Caption:** `Typed tools · Dynamic capabilities · No DOM scraping`

## 0:24–0:43 — Agent proposes

**On screen:** Paste Prompt 1. Cut the wait. Show three option cards and hover across their plan routes.

**Prompt 1:**

> Read this project through WebMCP and create three distinct resolutions with rationale, assumptions, confidence, cost, schedule, risk, and route geometry. Do not select one.

**Narration:**

> The agent authors original alternatives directly into the shared decision room. ChangeFrame validates their structure and geometry, while every assumption remains visible.

## 0:43–1:07 — Human changes reality; agent adapts

**On screen:** Label the constraint `Electrical riser access` and draw it across the first route. Show `Needs revision` and the Flight Recorder’s newly live `revise_resolution_option` capability. Paste Prompt 2, cut the wait, and reveal the green revised route.

**Prompt 2:**

> Read the new human constraint and revise every blocked route so it clears the region. Explain what changed. Do not select an option.

**Narration:**

> I add field knowledge the agent did not have. The route is blocked, the available tool set changes, and the agent re-plans. A revision is accepted only if it actually clears my constraint.

**Caption:** `Observe → Reason → Act → Verify`

## 1:07–1:28 — Shared work, separate authority

**On screen:** Select the revised option yourself. Paste Prompt 3. Cut the wait and show `+$6,500`, `0 days`, and `Awaiting human approval`.

**Prompt 3:**

> Propose one mitigation, calculate the selected option’s impact, and prepare the decision for human review. Do not approve it.

**Narration:**

> I select the option. The agent proposes a mitigation; ChangeFrame performs the arithmetic and prepares the decision. But notice what disappeared: there is no WebMCP approval tool.

## 1:28–1:43 — Human approval unlocks the next tool

**On screen:** Show only the two read tools live. Click **Approve decision** yourself. Show `draft_change_order` appearing. Enter `Continue and draft it.` Cut the wait and show `CO-ISS-019` marked `Draft`.

**Narration:**

> Only my approval unlocks drafting. The agent can create the change order, but it can never approve, sign, or execute it.

## 1:43–1:53 — Memorable close

**On screen:** Open the Flight Recorder on the final state: used agent tools, three passed human checkpoints, and `approve_decision — never a tool`.

**Narration:**

> That is WebMCP as a collaboration protocol: the agent proposes, ChangeFrame verifies, and the human authorizes.

**End card:**

```text
ChangeFrame
Agent proposes · App verifies · Human authorizes
change-frame.vercel.app
```

## Recording checklist

- [ ] Keep the finished video between 1:45 and 1:55.
- [ ] Paste prompts instead of slowly typing them.
- [ ] Cut agent waiting time but keep the real prompt and result visible.
- [ ] Zoom in on the capability change after the human constraint.
- [ ] Hold `approve_decision — never a tool` for at least two seconds.
- [ ] Use captions and clean voice audio; skip background music if it competes with speech.
- [ ] Record from the deployed URL after confirming it contains the latest build.

## Emergency recovery lines

If a proposed route is hard to block:

> I’ll place the field restriction directly across this candidate route so we can test whether the agent adapts.

If a revision is rejected:

> This is the guardrail working: ChangeFrame does not trust geometry merely because an agent proposed it.
