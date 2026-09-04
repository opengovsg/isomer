# Isomer code review instructions

Use these instructions when reviewing changes in this repository. More specific
rules are applied from `.github/instructions/*.instructions.md` based on the
changed file.

## Findings

- Report an issue only when a changed line creates a concrete correctness,
  security, data-integrity, or compatibility problem, or breaks an explicit
  repository invariant with a named maintenance or rollout consequence. Name
  the triggering input or caller and the observable consequence.
- Do not report formatting, import ordering, lint, or type errors already
  enforced by CI unless the change disables or bypasses that enforcement. Do
  not present a stylistic preference as a defect.
- Respect the terminology and invariants in the nearest `CONTEXT.md` and in
  current, non-superseded decisions under `docs/adr/`. When reporting a
  conflict, identify the exact invariant and explain how the changed behavior
  violates it.
- At a boundary between Studio, the database, shared packages, build tooling,
  and published sites, identify the exact producer, consumer, or persisted
  historical shape that the change breaks. Do not speculate about an unnamed
  caller.
- Recommend a test only when you can name the changed behavior that is
  uncovered and the assertion that would fail before the fix.

## Stacked pull requests

- Review every pull request against its actual base as an independently
  mergeable and revertible change. A non-default base may represent a stacked
  pull request. Do not assume that another pull request will repair a
  regression in the current diff.
