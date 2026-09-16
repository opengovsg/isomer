import type { ReactNode } from "react"
import { render, waitFor } from "@testing-library/react"
import { DiffDOM } from "diff-dom"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PreviewIframe } from "../../preview/PreviewIframe"
import { useDomDiff } from "../useDomDiff"

const Harness = ({
  beforeContent,
  afterContent,
}: {
  beforeContent: ReactNode
  afterContent: ReactNode
}) => {
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
          {beforeContent}
        </PreviewIframe>
      </div>
      <div data-testid="after-pane">
        <PreviewIframe
          callback={({ document }) => setAfterDocument(document ?? null)}
        >
          {afterContent}
        </PreviewIframe>
      </div>
    </div>
  )
}

async function renderDiff(beforeContent: ReactNode, afterContent: ReactNode) {
  const { getByTestId } = render(
    <Harness beforeContent={beforeContent} afterContent={afterContent} />,
  )

  await waitFor(() => {
    expect(getByTestId("status").textContent).toBe("ready")
  })

  const beforeDoc = getByTestId("before-pane").querySelector("iframe")
    ?.contentDocument
  const afterDoc = getByTestId("after-pane").querySelector("iframe")
    ?.contentDocument

  return { beforeDoc, afterDoc }
}

function findParagraph(doc: Document | null | undefined, text: string) {
  return Array.from(doc?.querySelectorAll("p") ?? []).find((p) =>
    p.textContent?.includes(text),
  )
}

// These fixtures and expectations were verified against the REAL diff-dom
// (not mocked) by temporarily logging the raw `operations` array from
// useDomDiff during development. That surfaced an important, non-obvious
// fact about diff-dom@5.2.1's default (un-configured) diffing: it is NOT
// content-aware across sibling elements. When more than one difference
// exists between two node lists at once (e.g. one paragraph's text changes
// *and* another paragraph is added/removed elsewhere), diff-dom collapses
// any length delta into a single add/removeElement anchored at the front of
// the child list, then reconciles every other difference via
// modifyTextElement — regardless of which paragraph a human would call
// "added" or "removed". Concretely, a fixture that both changes one
// paragraph's text ("Old paragraph" -> "New paragraph") and appends a new
// one ("Added paragraph") never produces a removeElement, and its
// addElement/modifyTextElement operations don't line up with which
// paragraph is intuitively "new" vs "changed" — every difference comes back
// as modifyTextElement except a spurious addElement for the untouched first
// paragraph. To exercise the "removed" and "added" DiffHighlightKind
// branches with real diff-dom output, this file uses three separate,
// minimal fixtures below, each isolating exactly one kind of change so
// diff-dom's front-anchored heuristic can't blend it with an unrelated
// change.
describe("useDomDiff", () => {
  it("highlights a removed paragraph in the before pane only", async () => {
    const { beforeDoc, afterDoc } = await renderDiff(
      <div>
        <p>Removed paragraph</p>
        <p>Kept paragraph</p>
      </div>,
      <div>
        <p>Kept paragraph</p>
      </div>,
    )

    const removed = findParagraph(beforeDoc, "Removed paragraph")
    expect(
      removed?.classList.contains("isomer-diff-highlight--removed"),
    ).toBe(true)

    const kept = findParagraph(afterDoc, "Kept paragraph")
    expect(kept?.classList.contains("isomer-diff-highlight")).toBe(false)
  })

  it("highlights an added paragraph in the after pane only", async () => {
    const { beforeDoc, afterDoc } = await renderDiff(
      <div>
        <p>Kept paragraph</p>
      </div>,
      <div>
        <p>Added paragraph</p>
        <p>Kept paragraph</p>
      </div>,
    )

    const added = findParagraph(afterDoc, "Added paragraph")
    expect(added?.classList.contains("isomer-diff-highlight--added")).toBe(
      true,
    )

    const keptBefore = findParagraph(beforeDoc, "Kept paragraph")
    expect(keptBefore?.classList.contains("isomer-diff-highlight")).toBe(
      false,
    )
  })

  it("highlights changed text as modified in both panes, leaving an untouched sibling unhighlighted", async () => {
    const { beforeDoc, afterDoc } = await renderDiff(
      <div>
        <p>Unchanged paragraph</p>
        <p>Old paragraph</p>
      </div>,
      <div>
        <p>Unchanged paragraph</p>
        <p>New paragraph</p>
      </div>,
    )

    const oldParagraph = findParagraph(beforeDoc, "Old paragraph")
    expect(
      oldParagraph?.classList.contains("isomer-diff-highlight--modified"),
    ).toBe(true)

    const newParagraph = findParagraph(afterDoc, "New paragraph")
    expect(
      newParagraph?.classList.contains("isomer-diff-highlight--modified"),
    ).toBe(true)

    const unchangedBefore = findParagraph(beforeDoc, "Unchanged paragraph")
    expect(unchangedBefore?.classList.contains("isomer-diff-highlight")).toBe(
      false,
    )
  })

  // Regression pin, not a "correctness" assertion: this is the ORIGINAL
  // combined fixture from this hook's initial draft — one paragraph's text
  // changes ("Old paragraph" -> "New paragraph") *and* a new paragraph is
  // appended ("Added paragraph") in the same edit, i.e. what a real Isomer
  // page edit touching more than one block actually looks like. Per the
  // file-level comment above, diff-dom's default heuristic is NOT
  // content-aware across siblings once more than one difference exists at
  // once, so this does not produce a clean removed/added pair. The
  // assertions below pin the ACTUAL, verified-real output as of
  // diff-dom@5.2.1 — including the parts that look wrong to a human reading
  // the diff — so that a future diff-dom version bump or options change
  // that alters this behavior gets caught here, and so Task 4's author has
  // one concrete example of what a realistic multi-change diff looks like
  // today:
  //   - beforeDoc: "Unchanged paragraph" is untouched (no op targets it).
  //   - beforeDoc: "Old paragraph" is marked "modified" — not "removed",
  //     even though its content doesn't survive into the after tree.
  //   - beforeDoc: nothing at all is marked "removed" — a real deletion
  //     ("Old paragraph"'s content) produces no removed highlight when it
  //     coincides with an addition elsewhere.
  //   - afterDoc: "Unchanged paragraph" is marked "added" — WRONG/
  //     misleading, since this paragraph's content is byte-identical to the
  //     before tree. diff-dom anchors its structural addElement op at the
  //     front of the child list rather than at the paragraph that's
  //     actually new.
  //   - afterDoc: "New paragraph" is marked "modified" (matches intuition).
  //   - afterDoc: "Added paragraph" is marked "modified" — not "added",
  //     even though this content did not exist in the before tree at all.
  it("pins diff-dom's real (non-obvious) output for a realistic multi-change edit", async () => {
    const { beforeDoc, afterDoc } = await renderDiff(
      <div>
        <p>Unchanged paragraph</p>
        <p>Old paragraph</p>
      </div>,
      <div>
        <p>Unchanged paragraph</p>
        <p>New paragraph</p>
        <p>Added paragraph</p>
      </div>,
    )

    // "before" pane
    const unchangedBefore = findParagraph(beforeDoc, "Unchanged paragraph")
    expect(unchangedBefore?.classList.contains("isomer-diff-highlight")).toBe(
      false,
    )

    const oldParagraph = findParagraph(beforeDoc, "Old paragraph")
    expect(
      oldParagraph?.classList.contains("isomer-diff-highlight--modified"),
    ).toBe(true)

    expect(
      beforeDoc?.querySelectorAll(".isomer-diff-highlight--removed").length,
    ).toBe(0)

    // "after" pane
    const unchangedAfter = findParagraph(afterDoc, "Unchanged paragraph")
    expect(
      unchangedAfter?.classList.contains("isomer-diff-highlight--added"),
    ).toBe(true)

    const newParagraph = findParagraph(afterDoc, "New paragraph")
    expect(
      newParagraph?.classList.contains("isomer-diff-highlight--modified"),
    ).toBe(true)

    const addedParagraph = findParagraph(afterDoc, "Added paragraph")
    expect(
      addedParagraph?.classList.contains("isomer-diff-highlight--modified"),
    ).toBe(true)
  })

  describe("error status", () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it("surfaces an 'error' status when diff-dom throws, without crashing the hook", async () => {
      // Force the try block in useDomDiff to throw by making the real
      // DiffDOM#diff implementation throw once, rather than mocking the
      // whole `diff-dom` module — this exercises useDomDiff's own
      // try/catch, not a fake replacement of the library's behavior.
      vi.spyOn(DiffDOM.prototype, "diff").mockImplementationOnce(() => {
        throw new Error("boom: simulated diff-dom failure")
      })

      const { getByTestId } = render(
        <Harness
          beforeContent={<p>Before</p>}
          afterContent={<p>After</p>}
        />,
      )

      await waitFor(() => {
        expect(getByTestId("status").textContent).toBe("error")
      })
    })
  })
})
