---
title: Structure tests as Arrange / Act / Assert
category: Testing
type: best-practice
---

## Pattern

Structure each test body in three phases, marked with comments:

- `// Arrange` — set up inputs, fixtures, mocks
- `// Act` — invoke the thing under test, capturing its result
- `// Assert` — `expect(...)` on the result

Match the repo's existing convention (used across the test suite): collapse
adjacent markers when a phase is empty or trivially one line —
`// Arrange / Act` when there's no setup, or `// Arrange / Act / Assert` for a
single-expression test.

## Why

AAA gives every test the same skeleton, so a reader instantly sees what's being
set up, what's exercised, and what's checked — without reverse-engineering it.
It also surfaces smells: multiple Act blocks mean the test is doing too much and
should be split; a giant Arrange hints at a missing helper or an over-coupled
unit. It's already the house style here, so deviating just adds inconsistency.

## Bad

```ts
it("replaces whitespace with hyphens", () => {
  expect(toFileId("Gazette Notice 2026.pdf")).toBe("Gazette-Notice-2026.pdf")
  const other = toFileId("a b")        // a second act buried among asserts
  expect(other).toBe("a-b")
})
```

## Good

```ts
it("replaces whitespace with hyphens", () => {
  // Arrange / Act
  const result = toFileId("Gazette Notice 2026.pdf")

  // Assert
  expect(result).toBe("Gazette-Notice-2026.pdf")
  expect(result).toMatch(FILE_ID_REGEX)
})
```

See `apps/studio/src/features/gazettes/utils/__tests__/toFileId.test.ts` for the
established style.

## How to detect

Flag test bodies with no AAA markers, or ones that interleave `expect(...)` with
fresh calls to the unit under test (a sign of multiple Act phases — split into
separate `it` blocks). One assertion target per test where practical.
