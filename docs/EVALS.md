# ChangeFrame Evaluation Plan

The product must prove that it handles unseen context, not merely replay one fixture.

## Component gates

- Starter sessions expose both context replacement and option submission, without containing any proposed answer.
- Context input rejects broken drawing, element, activity and contract references.
- Option input accepts 2–5 unique alternatives and requires rationale, assumptions and confidence.
- Route points must be finite and inside the active canvas.
- A human constraint marks every intersecting agent route as needing revision.
- A revised route that still intersects any referenced constraint is rejected without mutation.
- Stale state or option revisions fail without side effects.
- Cost, schedule and projected-budget arithmetic is performed by the domain.
- Selection and approval never appear in the agent tool registry.

## Unseen-brief integration eval

Run at least three briefs from different construction domains, for example mechanical coordination, electrical/fire separation and logistics/schedule recovery. Do not add those briefs to production source code.

For each run, verify that context is internally consistent; alternatives materially differ; rationales cite facts from the brief; missing facts appear as assumptions; confidence falls when important facts are missing; human constraints change the next agent action; invalid geometry is rejected; the workflow completes without reloads; approval stays human-only; and the artifact remains visibly marked draft.

## Anti-script check

Change all project IDs, element types, budget, issue text and route coordinates. The run must still succeed. Search production source for those eval values afterward; none should exist.

## Regression command

```bash
npm run verify:all
```

A deterministic starter context is permitted in production for immediate product comprehension, but it must contain no resolution options or expected answer. Deterministic answer fixtures are permitted only under `src/test` and `e2e`; they verify contracts and never generate live product answers.
