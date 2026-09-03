# ChangeFrame Demo Video Script

**Target runtime:** 2:35–2:50  
**Hard limit:** under 3:00  
**Core message:** The agent proposes. ChangeFrame verifies. The human authorizes.

## Before recording

- Deploy the current build and verify the public URL in a WebMCP-capable browser.
- Start from a reset session showing the Riverside Office Tower starter project and zero options.
- Use a 1920×1080 recording canvas, browser zoom around 90%, and a large readable cursor.
- Close notifications, bookmarks, unrelated tabs, terminals, and personal account information.
- Keep the Agent Flight Recorder closed until the final reveal.
- Rehearse the exact prompts below. Record in short truthful takes and remove agent waiting time in the edit.
- Do not speed up narration. Cut pauses instead.

## Recording script

### 0:00–0:12 — Cold open

**On screen:** Start on the populated Riverside plan. Slowly move the cursor across the HVAC duct and structural beam conflict. Do not show a title slide first.

**Narration:**

> A construction conflict can delay an entire project, but the information needed to resolve it is scattered across drawings, schedules, contracts, and people. ChangeFrame turns that moment into a shared decision room for humans and browser agents.

**Judge signal:** Potential Impact and polished execution appear immediately.

### 0:12–0:28 — Explain the product contract

**On screen:** Point to the project name, issue card, plan, and “0 agent proposals.” Briefly point to the “Replaceable starter project” banner.

**Narration:**

> This starter project is ready to inspect, but there is no canned solution and nothing is preselected. Through WebMCP, the agent reads the same live project state I see and can author original alternatives—or replace this entire context with a different project brief.

**Optional on-screen caption:** `No canned answers · Live shared state`

### 0:28–0:52 — Let the agent create alternatives

**On screen:** In the browser-agent conversation, enter Prompt 1. Cut the waiting time. Return to ChangeFrame as the option cards and route overlays appear.

**Prompt 1:**

> Inspect the current ChangeFrame decision context. Propose three materially different resolutions for this issue. Ground each option in the drawing, schedule, contracts, and baseline constraints. Make assumptions explicit, use honest confidence scores, and include distinct route geometry where appropriate. Do not select an option.

**Narration after the result appears:**

> The agent has created three situation-specific alternatives with rationale, assumptions, confidence, cost, schedule, risk, and plan geometry. These are structured WebMCP actions—not text copied from a chat window.

**On-screen action:** Hover across two option cards so the corresponding routes become prominent. Pause briefly on rationale and confidence.

**Judge signal:** WebMCP Leverage and Creativity.

### 0:52–1:22 — Human knowledge changes the answer

**On screen:** Select the constraint label field and type `Electrical riser access`. Draw an orange blocked region across one visible candidate route near the riser. Show the affected option becoming `Needs revision`.

**Narration:**

> But agents do not know everything happening in the field. I can add a non-negotiable human constraint directly on the drawing. ChangeFrame checks every route and immediately blocks any alternative that intersects it.

**On screen:** Enter Prompt 2. Cut the waiting time. Show the revised green route and revision status.

**Prompt 2:**

> Read the latest decision context and human constraints. Revise every alternative marked needs revision so its route clears the blocked region. Preserve the intent of the option, explain what changed, update assumptions and confidence, and do not select it.

**Narration:**

> The agent observes the new state and authors a revision. ChangeFrame independently rejects any route that still crosses the human constraint. The green route has passed that geometry check.

**Judge signal:** Visible perceive–reason–act–observe loop.

### 1:22–1:48 — Human selection and verified impact

**On screen:** Click **Select** on the revised option. Enter Prompt 3. Cut the wait, then show the updated impact and decision summary.

**Prompt 3:**

> For the selected option, propose one practical mitigation that could recover schedule without hiding additional cost. Calculate the resulting project impact, then prepare the decision for human review. Keep all assumptions visible and do not approve anything.

**Narration:**

> I—not the agent—select the preferred option. The agent can propose a mitigation, while ChangeFrame performs the cost, schedule, and projected-budget arithmetic. It can then prepare the decision, but preparation is not approval.

**On-screen action:** Point to the selected option, net cost, schedule impact, projected budget, and `Awaiting human approval` state.

**Judge signal:** Complete product execution with deterministic verification.

### 1:48–2:12 — Prove the authority boundary

**On screen:** Enter Prompt 4. Keep the agent’s refusal/limitation visible beside the disabled workflow state.

**Prompt 4:**

> Approve this decision and issue the change order.

**Narration:**

> Here is the critical safety boundary: there is no WebMCP approval tool. The agent cannot approve, sign, issue, or execute a contractual change. That authority remains with the project manager.

**On screen:** Click **Approve decision** yourself.

**Narration:**

> Only after my explicit approval does the next capability become available.

**Judge signal:** Intentional human-agent collaboration, not unrestricted automation.

### 2:12–2:32 — Generate the downstream artifact

**On screen:** Enter Prompt 5. Cut the wait and show the resulting draft change order.

**Prompt 5:**

> The human approval is now recorded. Draft the change order from the approved decision and show me the resulting artifact.

**Narration:**

> The agent can now draft the change order from the exact approved option revision, mitigation, cost, and schedule impact. It remains visibly marked as a draft.

### 2:32–2:50 — Flight Recorder reveal and closing line

**On screen:** Open the Agent Flight Recorder. Scroll just enough to show live, used, and locked tools, human checkpoints, actor labels, and state-version transitions.

**Narration:**

> The Flight Recorder makes the collaboration inspectable: which tools were available, who acted, what changed, and which state version produced the result. ChangeFrame demonstrates the future of WebMCP: the agent proposes, the application verifies, and the human authorizes.

**End card:**

```text
ChangeFrame
Agent proposes · App verifies · Human authorizes
change-frame.vercel.app
```

## Editing plan

- Use hard cuts when removing agent latency; do not use distracting transitions.
- Add five small prompt labels: `READ`, `PROPOSE`, `REVISE`, `PREPARE`, `DRAFT`.
- Keep background music optional and very low. Voice clarity matters more.
- Show the actual browser-agent prompts and actual resulting UI. Do not replace results with mock overlays.
- Add captions, especially for “there is no WebMCP approval tool.”
- Keep the repository or architecture diagram out of the main demo unless the final cut is under 2:40.

## Recovery lines

If the agent takes too long:

> I’ll cut the processing time, but this is the live agent operating through the page’s registered WebMCP tools.

If an option route is not easy to intersect:

> I’ll place the field restriction across this candidate route so we can test whether the agent adapts to new human knowledge.

If a revision fails geometry validation:

> That rejection is useful: ChangeFrame does not trust the proposal merely because an agent produced it. I’ll ask the agent to inspect the coordinates and revise again.

If the agent tries to approve:

> The request cannot be completed because approval is deliberately absent from the WebMCP capability set.

## Final rehearsal checklist

- [ ] The first meaningful product action happens before 0:15.
- [ ] The words “WebMCP” and “shared live state” are spoken clearly.
- [ ] Original rationale, assumptions, confidence, and routes are visible.
- [ ] A human-drawn constraint changes an agent-authored option.
- [ ] A revised route visibly clears the constraint.
- [ ] Human selection and approval are shown as clicks.
- [ ] The missing approval tool is explicitly demonstrated.
- [ ] The draft change order and Flight Recorder both appear.
- [ ] The final video is under 3:00 and includes clear audio and captions.
- [ ] The URL shown in the video is the deployed build used by judges.
