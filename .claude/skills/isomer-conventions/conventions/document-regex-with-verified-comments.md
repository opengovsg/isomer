---
title: Document every regex, and keep the comment correct
category: Readability
type: best-practice
---

## Pattern

Every non-trivial regex gets a comment that says (a) **what** it matches in
plain language and (b) **why** that pattern is needed here — the edge case,
spec, or input quirk that drove it. Crucially, **verify the comment actually
describes the regex**: a wrong or stale comment is worse than none, because
reviewers trust it instead of re-reading the pattern.

## Why

Regex is write-once, read-never: the author understands it for about a day,
then nobody does. The comment is the only affordance for the next reader and for
reviewers who won't mentally execute the pattern. The "why" matters as much as
the "what" — without it, someone later "simplifies" the regex and silently
breaks the edge case it was guarding. And an inaccurate comment actively
misleads, so correctness of the comment is part of the convention, not optional.

## Bad

```ts
// validate slug
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
```

The comment restates the variable name and explains nothing — not what counts as
valid, nor why (e.g. why no leading/trailing/double hyphens).

## Good

```ts
// Permalink slug: lowercase alphanumerics in hyphen-separated groups.
// No leading/trailing/consecutive hyphens — those break URL routing and
// collide with our auto-generated parent paths.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
```

## How to detect

Flag any regex literal or `new RegExp(...)` with no comment, or with a comment
that only repeats the variable name. When reviewing a documented regex, read the
pattern against its comment and call out mismatches (e.g. comment says "digits
only" but the class is `\w`). Treat a stale comment as a fixable, not a nit.
