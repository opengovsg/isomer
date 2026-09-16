# Readable Audit Log DOM Diff View (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the History panel's "View changes" button (currently a no-op placeholder) to a full-screen modal that renders the page's before/after content side by side and highlights what changed, using a DOM diff (`diffdom`) rather than a pixel or textual diff.

**Architecture:** Two `PreviewIframe` instances render `beforeContent`/`afterContent` (already available from the Phase 1 list query — no new fetch) independently, sharing the current page's `siteId`/`permalink`/`siteMap`. Once both iframes report their `document`, a `useDomDiff` hook runs `diffdom` against the two `document.body` trees and gets back a list of operations, each with a `route` (path of child-node indices). Since both trees are *already fully rendered independently* — unlike a single-pane diff — we only need `action` (to classify added/removed/modified) and `route` (to locate the node) from each operation; we never need to reconstruct or move content between panes. A pure `applyDiffHighlights` utility resolves each route and injects a CSS-class-based highlight + badge; a toggle switch flips one class on `<body>` to show/hide all highlights without re-running the diff.

**Tech Stack:** `diffdom` (new dependency), React + Chakra UI, `@opengovsg/design-system-react` (`Switch`), `react-frame-component` (via existing `PreviewIframe`), Vitest (plain unit tests for the pure DOM utility; Browser Mode for iframe-based integration tests).

Spec: `docs/superpowers/specs/2026-09-16-readable-audit-log-diff-view-design.md`
Builds on: `docs/superpowers/specs/2026-09-16-readable-audit-log-history-panel-design.md` (Phase 1, merged as PR #3417)

---

## Task 1: Add the `diffdom` dependency and confirm its real shape

**Files:**
- Modify: `apps/studio/package.json`

`diffdom`'s TypeScript declarations are loosely typed (its `Diff` class is a dynamic property bag — `this[key] = value` — not a discriminated union per action), so the exact fields available per `action` aren't enforced by the type system. This step confirms the real shape by reading the installed package directly, rather than guessing.

- [ ] **Step 1: Add the dependency**

Open `apps/studio/package.json` and add to `dependencies` (alphabetical position), following the `pdfreader` precedent — this codebase mostly uses pnpm workspace `catalog:` references, but single-app dependencies with no catalog entry use a direct caret range:

```json
"diffdom": "^4.0.5",
```

(Use whatever the latest stable major/minor actually is at install time — run `pnpm add diffdom` from `apps/studio` instead of hand-editing if you prefer; either way, land on a direct caret-range version, not a `catalog:` entry, since no other app in this monorepo needs it.)

Run: `pnpm install` (from repo root)

- [ ] **Step 2: Read the installed type declarations**

Run: `cat apps/studio/node_modules/diffdom/dist/index.d.ts` (or wherever `pnpm install` places it — check `apps/studio/node_modules/diffdom/package.json`'s `"types"` field if the path differs)

Confirm:
- The import is `import { DiffDOM } from "diffdom"` (not `"diff-dom"` — the npm package is published as `diffdom`, one word; double-check this from the actual installed `package.json` `"name"` field).
- `new DiffDOM().diff(nodeA, nodeB)` returns an array of objects, each with at least `action: string` and (for most actions) `route: number[]`.
- The action name strings actually present match this expected set: `addAttribute`, `modifyAttribute`, `removeAttribute`, `modifyTextElement`, `modifyComment`, `relocateGroup`, `removeElement`, `addElement`, `removeTextElement`, `addTextElement`, `replaceElement`, `modifyValue`, `modifyChecked`, `modifySelected`.

If the real shape differs from the above (different package name, different field name for the path, e.g. `path` instead of `route`), **stop and report back** rather than silently adapting Task 2/3's code — those tasks assume `action`/`route` as written below.

- [ ] **Step 3: Commit**

```bash
git add apps/studio/package.json pnpm-lock.yaml
git commit -m "chore(studio): add diffdom dependency for page diff view"
```

---

## Task 2: `applyDiffHighlights` — pure DOM highlighting utility

**Files:**
- Create: `apps/studio/src/features/editing-experience/components/Drawer/applyDiffHighlights.ts`
- Create: `apps/studio/src/features/editing-experience/components/Drawer/__tests__/applyDiffHighlights.test.ts`

This is a pure DOM-manipulation utility with no React/iframe dependency, so it gets plain Vitest unit tests (jsdom is enough — no Browser Mode needed). It takes a `Document` and a list of `{ route, kind }` pairs and injects CSS-class-based highlights + badges, plus a toggle mechanism that doesn't require re-running anything.

- [ ] **Step 1: Write the failing unit tests**

Create `apps/studio/src/features/editing-experience/components/Drawer/__tests__/applyDiffHighlights.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest"

import {
  applyDiffHighlights,
  resolveRoute,
  setHighlightsVisible,
} from "../applyDiffHighlights"

const buildDoc = (bodyHtml: string): Document => {
  const doc = document.implementation.createHTMLDocument("test")
  doc.body.innerHTML = bodyHtml
  return doc
}

describe("resolveRoute", () => {
  it("resolves a route to the correct nested node", () => {
    const doc = buildDoc(
      "<div><p>first</p><p>second</p></div><section>third</section>",
    )
    // body.childNodes: [0: div, 1: section]
    // div.childNodes: [0: p(first), 1: p(second)]
    const node = resolveRoute(doc.body, [0, 1])
    expect(node?.textContent).toBe("second")
  })

  it("returns null for an out-of-bounds route", () => {
    const doc = buildDoc("<div></div>")
    expect(resolveRoute(doc.body, [0, 5])).toBeNull()
  })

  it("returns null for an empty route pointing past the root's own children", () => {
    const doc = buildDoc("")
    expect(resolveRoute(doc.body, [0])).toBeNull()
  })
})

describe("applyDiffHighlights", () => {
  let doc: Document

  beforeEach(() => {
    doc = buildDoc("<div><p>first</p><p>second</p></div>")
  })

  it("adds the highlight class and a badge to the resolved element", () => {
    applyDiffHighlights(doc, [{ route: [0, 0], kind: "added" }])

    const p = doc.querySelector("p")
    expect(p?.classList.contains("isomer-diff-highlight")).toBe(true)
    expect(p?.classList.contains("isomer-diff-highlight--added")).toBe(true)
    expect(p?.querySelector(".isomer-diff-badge--added")).not.toBeNull()
  })

  it("applies the correct class per highlight kind", () => {
    applyDiffHighlights(doc, [
      { route: [0, 0], kind: "removed" },
      { route: [0, 1], kind: "modified" },
    ])

    const [first, second] = doc.querySelectorAll("p")
    expect(first?.classList.contains("isomer-diff-highlight--removed")).toBe(
      true,
    )
    expect(
      second?.classList.contains("isomer-diff-highlight--modified"),
    ).toBe(true)
  })

  it("silently skips a route that doesn't resolve to a node", () => {
    expect(() =>
      applyDiffHighlights(doc, [{ route: [9, 9], kind: "added" }]),
    ).not.toThrow()
    expect(doc.querySelector(".isomer-diff-highlight")).toBeNull()
  })

  it("injects the highlight stylesheet into the document head exactly once", () => {
    applyDiffHighlights(doc, [{ route: [0, 0], kind: "added" }])
    applyDiffHighlights(doc, [{ route: [0, 1], kind: "removed" }])

    expect(
      doc.head.querySelectorAll("#isomer-diff-highlight-styles"),
    ).toHaveLength(1)
  })
})

describe("setHighlightsVisible", () => {
  it("toggles a class on the document body", () => {
    const doc = buildDoc("<p>hello</p>")

    setHighlightsVisible(doc, false)
    expect(doc.body.classList.contains("isomer-diff-hidden")).toBe(true)

    setHighlightsVisible(doc, true)
    expect(doc.body.classList.contains("isomer-diff-hidden")).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:unit -- src/features/editing-experience/components/Drawer/__tests__/applyDiffHighlights.test.ts`

Expected: FAIL — `../applyDiffHighlights` does not exist.

- [ ] **Step 3: Implement `applyDiffHighlights.ts`**

Create `apps/studio/src/features/editing-experience/components/Drawer/applyDiffHighlights.ts`:

```ts
export type DiffHighlightKind = "added" | "removed" | "modified"

export interface DiffHighlight {
  route: number[]
  kind: DiffHighlightKind
}

const STYLE_ELEMENT_ID = "isomer-diff-highlight-styles"

const HIGHLIGHT_CSS = `
.isomer-diff-highlight { position: relative; }
.isomer-diff-highlight--added { background-color: rgba(37, 99, 235, 0.18) !important; }
.isomer-diff-highlight--removed { background-color: rgba(217, 119, 6, 0.18) !important; }
.isomer-diff-highlight--modified { background-color: rgba(124, 58, 237, 0.18) !important; }
.isomer-diff-badge {
  position: absolute;
  top: -0.5rem;
  left: -0.5rem;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  line-height: 1;
  color: #fff;
  z-index: 2147483647;
  pointer-events: none;
  font-family: sans-serif;
}
.isomer-diff-badge--added { background-color: #2563eb; }
.isomer-diff-badge--removed { background-color: #d97706; }
.isomer-diff-badge--modified { background-color: #7c3aed; }
body.isomer-diff-hidden .isomer-diff-highlight { background-color: transparent !important; }
body.isomer-diff-hidden .isomer-diff-badge { display: none; }
`

const BADGE_TEXT: Record<DiffHighlightKind, string> = {
  added: "+",
  removed: "−",
  modified: "~",
}

/**
 * Walks a diffDOM `route` (an array of childNodes indices from `root`
 * downward) and returns the node it points to, or null if any step is
 * out of bounds. diffDOM's route indexing is unverified against our own
 * assumptions beyond what Task 1 confirmed from its type declarations —
 * this defensive null-return (rather than throwing) is what lets
 * `applyDiffHighlights` skip a bad route instead of crashing the whole
 * diff view.
 */
export function resolveRoute(root: Node, route: number[]): Node | null {
  let current: Node = root
  for (const index of route) {
    const next = current.childNodes[index]
    if (!next) return null
    current = next
  }
  return current
}

function toHighlightableElement(node: Node | null): HTMLElement | null {
  if (!node) return null
  if (node.nodeType === Node.ELEMENT_NODE) return node as HTMLElement
  return node.parentElement
}

function ensureHighlightStylesInjected(doc: Document): void {
  if (doc.getElementById(STYLE_ELEMENT_ID)) return
  const style = doc.createElement("style")
  style.id = STYLE_ELEMENT_ID
  style.textContent = HIGHLIGHT_CSS
  doc.head.appendChild(style)
}

/**
 * Resolves each highlight's route against `doc.body` and injects a
 * highlight class + badge at that node. Routes that don't resolve to an
 * actual node (out of bounds, or diffDOM reporting a route shape we don't
 * expect) are silently skipped rather than thrown — one bad route should
 * never take down the rest of the diff view.
 */
export function applyDiffHighlights(
  doc: Document,
  highlights: DiffHighlight[],
): void {
  ensureHighlightStylesInjected(doc)

  for (const { route, kind } of highlights) {
    const node = resolveRoute(doc.body, route)
    const element = toHighlightableElement(node)
    if (!element) continue

    element.classList.add("isomer-diff-highlight", `isomer-diff-highlight--${kind}`)

    const badge = doc.createElement("span")
    badge.className = `isomer-diff-badge isomer-diff-badge--${kind}`
    badge.textContent = BADGE_TEXT[kind]
    element.insertBefore(badge, element.firstChild)
  }
}

/** Shows/hides every highlight+badge injected by `applyDiffHighlights` without recomputing anything. */
export function setHighlightsVisible(doc: Document, visible: boolean): void {
  doc.body.classList.toggle("isomer-diff-hidden", !visible)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:unit -- src/features/editing-experience/components/Drawer/__tests__/applyDiffHighlights.test.ts`

Expected: PASS (all tests).

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck` and `pnpm lint`.

- [ ] **Step 6: Commit**

```bash
git add apps/studio/src/features/editing-experience/components/Drawer/applyDiffHighlights.ts apps/studio/src/features/editing-experience/components/Drawer/__tests__/applyDiffHighlights.test.ts
git commit -m "feat(editing-experience): add pure DOM diff highlighting utility"
```

---

## Task 3: `useDomDiff` — runs diffdom and classifies operations per pane

**Files:**
- Create: `apps/studio/src/features/editing-experience/components/Drawer/useDomDiff.ts`
- Create: `apps/studio/src/features/editing-experience/components/Drawer/__tests__/useDomDiff.browser.test.tsx`

This hook takes two `Document | null` values (the before/after iframes' documents, once mounted) and, once both are non-null, runs `diffdom` and applies highlights via Task 2's utility — using the **real** `diffdom` library (not mocked), against small, deliberately different static HTML fixtures, per the design spec's testing approach.

- [ ] **Step 1: Write the failing test**

Create `apps/studio/src/features/editing-experience/components/Drawer/__tests__/useDomDiff.browser.test.tsx`:

```tsx
import { render, waitFor } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"

import { PreviewIframe } from "../../preview/PreviewIframe"
import { useDomDiff } from "../useDomDiff"

const BEFORE_HTML = (
  <div>
    <p>Unchanged paragraph</p>
    <p>Old paragraph</p>
  </div>
)

const AFTER_HTML = (
  <div>
    <p>Unchanged paragraph</p>
    <p>New paragraph</p>
    <p>Added paragraph</p>
  </div>
)

const Harness = () => {
  const [beforeDocument, setBeforeDocument] = useState<Document | null>(null)
  const [afterDocument, setAfterDocument] = useState<Document | null>(null)
  const { status } = useDomDiff({ beforeDocument, afterDocument })

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="before-pane">
        <PreviewIframe
          callback={({ document }) => setBeforeDocument(document ?? null)}
        >
          {BEFORE_HTML}
        </PreviewIframe>
      </div>
      <div data-testid="after-pane">
        <PreviewIframe
          callback={({ document }) => setAfterDocument(document ?? null)}
        >
          {AFTER_HTML}
        </PreviewIframe>
      </div>
    </div>
  )
}

describe("useDomDiff", () => {
  it("highlights removed content in the before iframe and added content in the after iframe", async () => {
    const { getByTestId } = render(<Harness />)

    await waitFor(() => {
      expect(getByTestId("status").textContent).toBe("ready")
    })

    const beforeIframe = getByTestId("before-pane").querySelector("iframe")
    const afterIframe = getByTestId("after-pane").querySelector("iframe")
    const beforeDoc = beforeIframe?.contentDocument
    const afterDoc = afterIframe?.contentDocument

    // "Old paragraph" only exists in the before tree — removed.
    const removed = Array.from(
      beforeDoc?.querySelectorAll("p") ?? [],
    ).find((p) => p.textContent?.includes("Old paragraph"))
    expect(
      removed?.classList.contains("isomer-diff-highlight--removed"),
    ).toBe(true)

    // "Added paragraph" only exists in the after tree — added.
    const added = Array.from(afterDoc?.querySelectorAll("p") ?? []).find(
      (p) => p.textContent?.includes("Added paragraph"),
    )
    expect(added?.classList.contains("isomer-diff-highlight--added")).toBe(
      true,
    )

    // "Unchanged paragraph" appears identically in both — no highlight.
    const unchangedBefore = Array.from(
      beforeDoc?.querySelectorAll("p") ?? [],
    ).find((p) => p.textContent === "Unchanged paragraph")
    expect(unchangedBefore?.classList.contains("isomer-diff-highlight")).toBe(
      false,
    )
  })
})
```

**Note for the implementer:** this test asserts on real `diffdom` output against real DOM content — it is intentionally not mocking `diffdom`. If "Old paragraph" → "New paragraph" is classified by the real library as `modifyTextElement` (both panes highlighted "modified") rather than a remove+add pair, **adjust this test's expectations to match what diffdom actually does** rather than forcing the implementation to match a guessed expectation — run it once with a `console.log(JSON.stringify(diffs))` inside `useDomDiff` temporarily if the first run's assertions don't match, to see the real operation list, then fix the test (not the categorization logic in Step 3, unless the real action names differ from what's listed there).

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:unit -- src/features/editing-experience/components/Drawer/__tests__/useDomDiff.browser.test.tsx`

Expected: FAIL — `../useDomDiff` does not exist.

- [ ] **Step 3: Implement `useDomDiff.ts`**

Create `apps/studio/src/features/editing-experience/components/Drawer/useDomDiff.ts`:

```ts
import { DiffDOM } from "diffdom"
import { useEffect, useState } from "react"

import type { DiffHighlight, DiffHighlightKind } from "./applyDiffHighlights"
import { applyDiffHighlights } from "./applyDiffHighlights"

export type DomDiffStatus = "pending" | "ready" | "error"

interface UseDomDiffParams {
  beforeDocument: Document | null
  afterDocument: Document | null
}

interface UseDomDiffResult {
  status: DomDiffStatus
}

// Diffdom operations whose route only resolves in the "before" tree (the
// node no longer exists after the change).
const REMOVAL_ACTIONS = new Set([
  "removeElement",
  "removeTextElement",
  "removeAttribute",
])

// Operations whose route only resolves in the "after" tree (the node
// didn't exist before the change).
const ADDITION_ACTIONS = new Set(["addElement", "addTextElement", "addAttribute"])

// Everything else (modifyTextElement, modifyAttribute, replaceElement,
// relocateGroup, modifyValue, modifyChecked, modifySelected,
// modifyComment) describes a node present at the same route in both
// trees, just changed — highlighted as "modified" in both panes. This
// intentionally does not attempt semantic move detection (e.g.
// relocateGroup) beyond marking the affected route "modified" — see the
// design spec's accepted limitation.
function classify(action: string): DiffHighlightKind | "both-modified" {
  if (REMOVAL_ACTIONS.has(action)) return "removed"
  if (ADDITION_ACTIONS.has(action)) return "added"
  return "both-modified"
}

interface DiffDomOperation {
  action: string
  route?: number[]
}

export function useDomDiff({
  beforeDocument,
  afterDocument,
}: UseDomDiffParams): UseDomDiffResult {
  const [status, setStatus] = useState<DomDiffStatus>("pending")

  useEffect(() => {
    if (!beforeDocument?.body || !afterDocument?.body) return

    try {
      const dd = new DiffDOM()
      const operations = dd.diff(
        beforeDocument.body,
        afterDocument.body,
      ) as unknown as DiffDomOperation[]

      const beforeHighlights: DiffHighlight[] = []
      const afterHighlights: DiffHighlight[] = []

      for (const op of operations) {
        if (!Array.isArray(op.route)) continue

        const kind = classify(op.action)
        if (kind === "removed") {
          beforeHighlights.push({ route: op.route, kind: "removed" })
        } else if (kind === "added") {
          afterHighlights.push({ route: op.route, kind: "added" })
        } else {
          beforeHighlights.push({ route: op.route, kind: "modified" })
          afterHighlights.push({ route: op.route, kind: "modified" })
        }
      }

      applyDiffHighlights(beforeDocument, beforeHighlights)
      applyDiffHighlights(afterDocument, afterHighlights)
      setStatus("ready")
    } catch (error) {
      console.error("Failed to compute page diff", error)
      setStatus("error")
    }
  }, [beforeDocument, afterDocument])

  return { status }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:unit -- src/features/editing-experience/components/Drawer/__tests__/useDomDiff.browser.test.tsx`

Expected: PASS. If the real diffdom output doesn't match the test's assumptions (see the note in Step 1), adjust the test's expectations to match reality, re-run, and note this in your self-review.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck` and `pnpm lint`.

- [ ] **Step 6: Commit**

```bash
git add apps/studio/src/features/editing-experience/components/Drawer/useDomDiff.ts apps/studio/src/features/editing-experience/components/Drawer/__tests__/useDomDiff.browser.test.tsx
git commit -m "feat(editing-experience): add useDomDiff hook for page diff highlighting"
```

---

## Task 4: `PageDiffModal` — the full-screen diff view, wired to the History panel

**Files:**
- Create: `apps/studio/src/features/editing-experience/components/Drawer/PageDiffModal.tsx`
- Modify: `apps/studio/src/features/editing-experience/components/Drawer/HistoryStateDrawer.tsx`
- Create: `apps/studio/src/features/editing-experience/components/Drawer/__tests__/PageDiffModal.browser.test.tsx`
- Modify: `apps/studio/src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/studio/src/features/editing-experience/components/Drawer/__tests__/PageDiffModal.browser.test.tsx`:

```tsx
import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { PageDiffModal } from "../PageDiffModal"

const noop = vi.hoisted(() => vi.fn())

vi.mock("~/utils/trpc", () => ({
  trpc: {
    site: {
      getLocalisedSitemap: {
        useSuspenseQuery: () => [{ id: "root", children: [] }],
      },
      getConfig: {
        useSuspenseQuery: () => [{}],
      },
      getFooter: {
        useSuspenseQuery: () => [{ content: {} }],
      },
      getNavbar: {
        useSuspenseQuery: () => [{ content: {} }],
      },
    },
  },
}))

vi.mock("~/features/preview/hooks/useSiteThemeCssVars", () => ({
  useSiteThemeCssVars: () => ({}),
}))

const PAGE: IsomerSchema = {
  page: { title: "About us", description: "About us" },
  layout: "content",
  content: [],
  version: "0.1.0",
}

const BEFORE_PAGE: IsomerSchema = {
  ...PAGE,
  content: [
    {
      type: "prose",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Old text" }] },
      ],
    },
  ],
}

const AFTER_PAGE: IsomerSchema = {
  ...PAGE,
  content: [
    {
      type: "prose",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "New text" }] },
      ],
    },
  ],
}

const renderModal = (isOpen: boolean) =>
  render(
    <ThemeProvider theme={theme}>
      <EditorDrawerProvider
        initialPageState={PAGE}
        type={ResourceType.Page}
        permalink="about-us"
        siteId={1}
        pageId={1}
        updatedAt={new Date()}
        title="About us"
      >
        <PageDiffModal
          isOpen={isOpen}
          onClose={noop}
          row={{
            createdAt: new Date("2026-01-01T00:00:00Z"),
            actor: { name: "Alice" },
            beforeContent: BEFORE_PAGE,
            afterContent: AFTER_PAGE,
          }}
        />
      </EditorDrawerProvider>
    </ThemeProvider>,
  )

describe("PageDiffModal", () => {
  it("does not render modal content when closed", () => {
    renderModal(false)
    expect(screen.queryByText("Alice")).toBeNull()
  })

  it("shows the change metadata and a highlight toggle when open", async () => {
    renderModal(true)

    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeNull()
    })
    expect(
      screen.queryByRole("switch", { name: "Highlight changes" }),
    ).not.toBeNull()
  })

  it("toggles highlight visibility on the rendered iframes", async () => {
    renderModal(true)

    await waitFor(() => {
      const iframes = document.querySelectorAll("iframe")
      expect(iframes).toHaveLength(2)
    })

    const toggle = screen.getByRole("switch", { name: "Highlight changes" })
    // Default is on (per the approved design: highlights are on by default).
    expect(toggle).toBeChecked()

    toggle.click()
    expect(toggle).not.toBeChecked()
  })
})
```

Update `apps/studio/src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx` — add a new test to the existing `describe("HistoryStateDrawer", ...)` block (after the existing three tests), and add the same two `vi.mock` calls used above (`~/utils/trpc`'s `site.*` queries and `~/features/preview/hooks/useSiteThemeCssVars`) to this file's existing `vi.mock("~/utils/trpc", ...)` block — merge them into the existing mock object rather than adding a second `vi.mock` call for the same module:

```tsx
  it("opens the diff modal with the row's data when View changes is clicked", async () => {
    // Arrange
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                id: "1",
                createdAt: new Date("2026-01-01T00:00:00Z"),
                actor: { id: "u1", name: "Alice", email: "alice@example.com" },
                beforeContent: EMPTY_PAGE,
                afterContent: EMPTY_PAGE,
              },
            ],
            nextOffset: null,
          },
        ],
      },
      fetchNextPage: noop,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    })

    // Act
    renderDrawer()
    screen.getByRole("button", { name: "View changes" }).click()

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeNull()
    })
  })
```

(This new test needs `waitFor` imported from `@testing-library/react` in this file's existing import line.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:unit -- src/features/editing-experience/components/Drawer/__tests__/PageDiffModal.browser.test.tsx src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx`

Expected: FAIL — `../PageDiffModal` does not exist, and `HistoryStateDrawer`'s new test fails since nothing opens yet.

- [ ] **Step 3: Implement `PageDiffModal.tsx`**

Create `apps/studio/src/features/editing-experience/components/Drawer/PageDiffModal.tsx`:

```tsx
import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { IframeCallbackFnProps } from "~/types/dom"
import {
  Box,
  Flex,
  IconButton,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Switch } from "@opengovsg/design-system-react"
import { format } from "date-fns"
import { useCallback, useEffect, useState } from "react"
import { BiX } from "react-icons/bi"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { trpc } from "~/utils/trpc"

import { PreviewIframe } from "../preview/PreviewIframe"
import PreviewWithCustomSitemap from "../preview/PreviewWithCustomSitemap"
import { setHighlightsVisible } from "./applyDiffHighlights"
import { useDomDiff } from "./useDomDiff"

export interface PageDiffModalRow {
  createdAt: Date
  actor: { name: string }
  beforeContent: IsomerSchema
  afterContent: IsomerSchema
}

interface PageDiffModalProps
  extends Pick<UseDisclosureReturn, "isOpen" | "onClose"> {
  row: PageDiffModalRow | null
}

export const PageDiffModal = ({
  isOpen,
  onClose,
  row,
}: PageDiffModalProps): JSX.Element => {
  const { siteId, pageId, permalink } = useEditorDrawerContext()
  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId: pageId,
  })
  const themeCssVars = useSiteThemeCssVars({ siteId })

  const [beforeDocument, setBeforeDocument] = useState<Document | null>(null)
  const [afterDocument, setAfterDocument] = useState<Document | null>(null)
  const [showHighlights, setShowHighlights] = useState(true)

  const handleBeforeMount = useCallback(
    ({ document }: IframeCallbackFnProps) =>
      setBeforeDocument(document ?? null),
    [],
  )
  const handleAfterMount = useCallback(
    ({ document }: IframeCallbackFnProps) => setAfterDocument(document ?? null),
    [],
  )

  const { status } = useDomDiff({ beforeDocument, afterDocument })

  useEffect(() => {
    if (beforeDocument) setHighlightsVisible(beforeDocument, showHighlights)
    if (afterDocument) setHighlightsVisible(afterDocument, showHighlights)
  }, [showHighlights, beforeDocument, afterDocument])

  if (!row) return <></>

  return (
    <Modal size="full" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent height="$100vh" overflow="hidden">
        <Flex direction="column" h="full" key={row.createdAt.toISOString()}>
          <Flex
            justify="space-between"
            align="center"
            px="1.5rem"
            py="1rem"
            borderBottom="1px solid"
            borderColor="base.divider.medium"
          >
            <Box>
              <Text textStyle="h6">
                Changes from {format(row.createdAt, "d MMM yyyy, h:mm a")}
              </Text>
              <Text textStyle="caption-2" color="base.content.medium">
                {row.actor.name}
              </Text>
            </Box>
            <Flex align="center" gap="0.75rem">
              {status === "error" && (
                <Text textStyle="caption-2" color="utility.feedback.critical">
                  Couldn't compute a detailed diff — showing before/after
                  only.
                </Text>
              )}
              <Text textStyle="caption-2" as="label" htmlFor="highlight-toggle">
                Highlight changes
              </Text>
              <Switch
                id="highlight-toggle"
                aria-label="Highlight changes"
                size="md"
                isChecked={showHighlights}
                onChange={(e) => setShowHighlights(e.target.checked)}
              />
              <IconButton
                aria-label="Close"
                icon={<BiX fontSize="1.25rem" />}
                variant="clear"
                onClick={onClose}
              />
            </Flex>
          </Flex>
          <Flex flex={1} overflow="hidden">
            <Box
              flex={1}
              borderRight="1px solid"
              borderColor="base.divider.medium"
              overflow="auto"
            >
              <PreviewIframe style={themeCssVars} callback={handleBeforeMount}>
                <PreviewWithCustomSitemap
                  {...row.beforeContent}
                  siteId={siteId}
                  permalink={permalink}
                  siteMap={siteMap}
                />
              </PreviewIframe>
            </Box>
            <Box flex={1} overflow="auto">
              <PreviewIframe style={themeCssVars} callback={handleAfterMount}>
                <PreviewWithCustomSitemap
                  {...row.afterContent}
                  siteId={siteId}
                  permalink={permalink}
                  siteMap={siteMap}
                />
              </PreviewIframe>
            </Box>
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  )
}
```

- [ ] **Step 4: Wire the modal into `HistoryStateDrawer.tsx`**

Open `apps/studio/src/features/editing-experience/components/Drawer/HistoryStateDrawer.tsx`. Add imports:

```ts
import { useState } from "react"
```

```ts
import type { PageDiffModalRow } from "./PageDiffModal"
import { PageDiffModal } from "./PageDiffModal"
```

Add local state right after the `useQueryParse` line:

```ts
  const [selectedRow, setSelectedRow] = useState<PageDiffModalRow | null>(
    null,
  )
```

Replace the "View changes" button's `onClick`:

```tsx
              <Button
                size="xs"
                variant="outline"
                onClick={() => setSelectedRow(row)}
              >
                View changes
              </Button>
```

Add the modal, rendered as a sibling of the outer `<Flex>` (i.e. return a fragment wrapping the existing `<Flex>...</Flex>` and the new modal):

```tsx
  return (
    <>
      <Flex direction="column" h="full">
        {/* ...unchanged existing content... */}
      </Flex>
      <PageDiffModal
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
      />
    </>
  )
```

(Wrap the existing `return (<Flex ...>...</Flex>)` in a `<>...</>` fragment rather than rewriting its internals — only the outer wrapper and the new `<PageDiffModal>` sibling are new.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test:unit -- src/features/editing-experience/components/Drawer/__tests__/PageDiffModal.browser.test.tsx src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx`

Expected: PASS (all tests in both files). If `PageDiffModal`'s tests fail because `row` structurally doesn't satisfy something `PreviewWithCustomSitemap` needs beyond what's mocked, check the actual error against the mocked `trpc.site.*` queries above — you likely need to adjust the mocked return shapes (e.g. `getConfig`'s real shape may have more required fields than `{}"`) rather than changing `PageDiffModal.tsx` itself.

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm typecheck` and `pnpm lint`.

- [ ] **Step 7: Commit**

```bash
git add apps/studio/src/features/editing-experience/components/Drawer/PageDiffModal.tsx apps/studio/src/features/editing-experience/components/Drawer/HistoryStateDrawer.tsx apps/studio/src/features/editing-experience/components/Drawer/__tests__/PageDiffModal.browser.test.tsx apps/studio/src/features/editing-experience/components/Drawer/__tests__/HistoryStateDrawer.browser.test.tsx
git commit -m "$(cat <<'EOF'
feat(editing-experience): wire View changes to the DOM diff modal

Clicking a History row's "View changes" button now opens a full-screen
before/after view of the page, with diffdom-computed highlights on
each pane (added/removed/modified) and a toggle to hide them.
EOF
)"
```

---

## Task 5: Manual smoke test

- [ ] **Step 1: Start the dev server** (from `apps/studio`): `pnpm dev`

- [ ] **Step 2: Exercise the happy path**

1. Open a page in the Studio editor, make two distinct edits (saving between each) so there are at least two `ResourceUpdate` entries with real content diffs.
2. Open "View page history", click "View changes" on one row.
3. Confirm: a full-screen modal opens with two side-by-side page renders (before | after), the changed content is highlighted with a colored fill + badge (blue `+` for additions, amber `−` for removals, purple `~` for modifications), and unrelated/unchanged content has no highlight.
4. Toggle "Highlight changes" off — confirm highlights disappear and both panes show a clean render. Toggle back on — confirm they reappear.
5. Close the modal — confirm it returns cleanly to the History panel, and the underlying page editor is untouched.

- [ ] **Step 3: Check the browser console** for errors/warnings while opening, toggling, and closing the modal.

---

## Self-review notes (for whoever executes this plan)

- Task 1 Step 2 is a real, flagged uncertainty (diffdom's exact package name / field names weren't independently verifiable ahead of time) with an explicit instruction to stop and report if reality differs from what Tasks 2/3 assume — don't silently paper over a mismatch.
- Task 3 Step 1's test similarly flags that the exact operation-type breakdown for a text change (single `modifyTextElement` vs a remove+add pair) is unverified until the real library runs — the fix-the-test-not-the-code instruction there is deliberate.
- The "accepted limitation" from the design spec (no semantic move detection, e.g. `relocateGroup` just gets marked "modified" rather than reconstructed as a move) is implemented as designed in `useDomDiff.ts`'s `classify` function — don't expand scope to handle it more precisely without going back to the spec.
- `PageDiffModal`'s `key={row.createdAt.toISOString()}` forces the whole pane tree (including both `PreviewIframe`s) to remount when a different row is viewed in the same session, so there's no risk of stale highlights from a previous row bleeding into a new one.
