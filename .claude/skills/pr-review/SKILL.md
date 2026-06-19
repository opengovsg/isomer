---
name: pr-review
description: Grade a pull request against the project risk taxonomy, flag hot-path touches, surface missing tests/stories, and post a structured review comment. Does not approve or merge.
---

# Instructions

This skill grades the current pull request. It is read-only with respect to merge state — it never approves, never requests changes, never closes. It posts one annotated comment.

If the request is to "review this PR" with full sign-off authority (typical human-engineer ask), prefer the `review-pr` skill instead. This skill is for **automation**: a structured grade that humans + CI consume.

## Inputs

- The current branch's diff against `main`.
- `docs/risk-taxonomy.md` — file-glob → risk tier mapping. **Read this at run time, not from memory.**
- `docs/ai-workflow.md` — canonical Linear/Figma fields and PR conventions.
- All `CLAUDE.md` files under directories touched by the diff.

## Procedure

1. **Resolve the diff.** Use `git diff --name-only main...HEAD` to list changed files. If on `main`, abort.
2. **Load the taxonomy.** Read `docs/risk-taxonomy.md`. Build the glob → tier table from the file as-is — do not hardcode.
3. **Tier each file.** Match top-down; first match wins for that file. The PR tier is the max across all files.
4. **Hot-path scan.** Cross-reference the "Hot paths to flag" section. Note any matches.
5. **Convention scan.** For each touched directory with a `CLAUDE.md`, read it and look for diff content that violates a documented "Anti-pattern" or rule. Cite the file:line.
6. **Coverage scan.**
   - Touched `apps/studio/src/server/modules/**` without a corresponding `__tests__/` change → flag missing test.
   - Touched `packages/components/src/templates/**/components/**` without a `*.stories.tsx` change → flag missing story.
   - New tRPC procedure without an input schema in `apps/studio/src/schemas/` → flag.
7. **Auto-approve eligibility.** If tier is `risk:low` AND every condition in the taxonomy's "Auto-approve caveats" holds, mark eligible. Otherwise mark not eligible with the failing condition.
8. **Post the annotation.** Format below. Use `gh pr comment` to post to the current PR.

## Output format

The PR comment must be exactly this shape:

```markdown
## 🤖 PR review automation

**Risk tier:** `risk:<low|medium|high>`
**Auto-approve eligible:** yes | no — <one-line reason>

### Hot paths touched
- `<path>` — <why hot>
(or: "None.")

### Convention checks
- ✅ <rule> — <file>
- ⚠️  <rule violated> — <file:line>
(or: "All checked rules pass.")

### Coverage
- Server module changed without test: <list>
- Component changed without story: <list>
- New procedure without schema: <list>
(omit sections that don't apply)

### Suggested reviewers
<area owner from CODEOWNERS, or @-mention based on label>
```

## Hard rules

- **Never approve, never request changes, never merge.** This skill comments only.
- **Never bypass the taxonomy.** If the taxonomy says `risk:high`, the comment says `risk:high` — even if the diff "looks small".
- **Read the taxonomy and CLAUDE.md files at run time.** Do not cache assumptions about file contents; the team updates them frequently.
- **Cite file:line for every convention violation.** Vague comments are worse than no comments.
- **Do not summarise the diff.** That's the PR description's job. This comment is grading only.

## Failure modes

- Diff has 0 files → exit silently. No comment.
- `risk-taxonomy.md` missing → post a comment saying so and skip grading.
- Convention scan throws → post a partial comment with what was completed and flag the failure for a human.

## Anti-patterns the agent must refuse

- Bypassing the risk taxonomy because "this change is obviously fine".
- Approving a PR via this skill — wrong tool, use `review-pr`.
- Adding speculative concerns not grounded in the diff or a documented rule.
- Long prose explanations — keep each bullet under one line.
