---
name: feature-plan
description: Produce 2-3 implementation approaches with trade-offs for a scoped feature ticket. Stops and waits for a human to pick. Does not write code.
---

# Instructions

This skill turns a feature ticket into a small set of distinct approaches with clear trade-offs, then **stops and waits** for a human to pick. It does not write code. If the ticket is one-shot eligible per `docs/oneshot-vs-plan-threshold.md`, the `feature-implement` skill runs directly instead — this skill is not invoked.

The output is a Linear comment a human can scan in 60 seconds and pick from.

## Inputs

- A Linear ticket ID and its content.
- A Figma frame URL (for design work).
- The repo at HEAD of `main`.
- `docs/ai-workflow.md` for ticket field validation.
- `docs/oneshot-vs-plan-threshold.md` to confirm plan-first is correct.
- `CLAUDE.md` files in directories the feature will touch.

## Procedure

### 1. Validate the ticket

Read the ticket. Verify the canonical fields per `docs/ai-workflow.md`:

- `area:*` label, `feature` or `design-iteration` type label
- `Goal`, `Design`, `Constraints`, `Out of scope` sections in the description
- Figma frame URL with a human-readable frame name

If anything is missing, post a Linear comment listing what's missing and stop.

### 2. Confirm plan-first

Re-check the one-shot thresholds in `docs/oneshot-vs-plan-threshold.md`. If the ticket qualifies for one-shot, abort and hand off to `feature-implement`.

### 3. Generate 2-3 distinct approaches

Each approach must:

- Solve the goal stated in the ticket.
- Be **materially different** from the others. Two approaches that differ only in variable naming or file location are one approach.
- Be implementable in the codebase as it stands today — no "we'd need to introduce X first".
- Have at least one *real* drawback. If you can't name a drawback, you haven't thought hard enough.

Distinctness checklist — approaches should vary on at least one of:

- Data model shape (e.g. HashMap vs array vs joined table)
- Where the logic lives (server module vs client hook vs shared utility)
- Compatibility surface (new endpoint vs extending an existing one)
- User-visible behaviour (sync vs async, optimistic vs pessimistic)

If only one approach is genuinely viable, post that finding to the ticket and stop — don't fabricate a second.

### 4. Score each approach

For each approach, populate:

- **Sketch**: ≤ 5 bullets describing the implementation, with file paths.
- **LOC estimate**: rough order of magnitude (50, 200, 500). Include tests and stories.
- **Risk tier**: per `docs/risk-taxonomy.md`.
- **Pros**: 2–4 bullets. Reuses existing patterns, fewer files, easier to roll back.
- **Cons**: 2–4 bullets. The real ones, including future maintenance.
- **Reversibility**: easy / medium / hard. Hard = "needs a migration to undo".

### 5. Post to Linear and stop

Format:

```markdown
## 🤖 Feature plan — <ticket-id>

**Goal recap:** <one sentence from the ticket>
**Plan-first because:** <which trigger from oneshot-vs-plan-threshold.md fired>

---

### Approach A — <name>
- **Sketch:** ...
- **LOC estimate:** ~N
- **Risk:** risk:<tier>
- **Reversibility:** ...
- **Pros:** ...
- **Cons:** ...

### Approach B — <name>
... (same shape)

### Approach C — <name>
... (same shape, if applicable)

---

**Agent recommendation:** Approach <A|B|C> — <one sentence why>.
**Waiting for:** human picks an approach by replying with `pick: A|B|C`.
```

After posting, **stop**. Do not write code. Do not open a PR. Do not infer the choice.

## Picking is the human's job

If the comment thread receives a reply matching `pick: A`, `pick: B`, or `pick: C`, the `feature-implement` skill picks up with that selection. Anything else (questions, "what about X?", "combine A and B") is a request for the agent to rerun with new constraints — re-do step 3 from the new context.

## Hard rules

- **Never write code in this skill.** The deliverable is a Linear comment.
- **Never pick the approach yourself.** The recommendation is a suggestion; the choice is human.
- **No more than 3 approaches.** More than 3 is decision fatigue, not optionality.
- **No fabricated alternatives.** If only one approach makes sense, say so.
- **Cite file paths in every sketch.** Vague "add a service" is not a plan.

## Anti-patterns the agent must refuse

- Bundling all three approaches into one synthesis ("approach A but with B's data model").
- Treating "use TypeScript" or "add tests" as a differentiator.
- Skipping the cons because the recommended approach "is obviously right".
- Proceeding to implement after posting, before a human picks.
