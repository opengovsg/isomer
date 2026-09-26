// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"

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
    expect(second?.classList.contains("isomer-diff-highlight--modified")).toBe(
      true,
    )
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

  it("highlights the parent element when a route resolves to a text node", () => {
    const textDoc = buildDoc("<p>hello</p>")
    // body.childNodes: [0: p]
    // p.childNodes: [0: text node "hello"]
    applyDiffHighlights(textDoc, [{ route: [0, 0], kind: "added" }])

    const p = textDoc.querySelector("p")
    expect(p?.classList.contains("isomer-diff-highlight")).toBe(true)
    expect(p?.classList.contains("isomer-diff-highlight--added")).toBe(true)
    expect(p?.querySelector(".isomer-diff-badge--added")).not.toBeNull()
  })

  it("does not insert a duplicate badge when applied twice for the same route and kind", () => {
    applyDiffHighlights(doc, [{ route: [0, 0], kind: "added" }])
    applyDiffHighlights(doc, [{ route: [0, 0], kind: "added" }])

    const p = doc.querySelector("p")
    expect(p?.querySelectorAll(".isomer-diff-badge")).toHaveLength(1)
  })

  it("replaces the previous highlight and badge when the same route is re-applied with a different kind", () => {
    applyDiffHighlights(doc, [{ route: [0, 0], kind: "removed" }])
    applyDiffHighlights(doc, [{ route: [0, 0], kind: "modified" }])

    const p = doc.querySelector("p")
    expect(p?.classList.contains("isomer-diff-highlight--modified")).toBe(true)
    expect(p?.classList.contains("isomer-diff-highlight--removed")).toBe(false)
    expect(p?.querySelectorAll(".isomer-diff-badge")).toHaveLength(1)
    expect(p?.querySelector(".isomer-diff-badge--modified")).not.toBeNull()
    expect(p?.querySelector(".isomer-diff-badge--removed")).toBeNull()
  })

  it("marks the badge as aria-hidden so screen readers skip it", () => {
    applyDiffHighlights(doc, [{ route: [0, 0], kind: "added" }])

    const badge = doc.querySelector(".isomer-diff-badge")
    expect(badge?.getAttribute("aria-hidden")).toBe("true")
  })
})

// These two tests use the real global `document` (not one built via
// `document.implementation.createHTMLDocument`, which always has a null
// `defaultView` in jsdom) so they actually exercise the
// `getComputedStyle`-based branch of the positioning fix, rather than
// only ever hitting its detached-document fallback.
describe("applyDiffHighlights positioning (real jsdom document)", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("sets position: relative on an element with no explicit position", () => {
    document.body.innerHTML = "<p>hello</p>"

    applyDiffHighlights(document, [{ route: [0, 0], kind: "added" }])

    const p = document.querySelector("p")
    expect(p?.style.position).toBe("relative")
  })

  it("leaves an element's existing non-static position untouched", () => {
    document.body.innerHTML = '<p style="position: absolute;">hello</p>'

    applyDiffHighlights(document, [{ route: [0, 0], kind: "added" }])

    const p = document.querySelector("p")
    expect(p?.style.position).toBe("absolute")
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
