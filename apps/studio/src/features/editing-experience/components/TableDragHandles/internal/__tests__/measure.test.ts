import type { Rect, TableGeometry } from "../axisMath"
import { reconcileGeometries, viewportPointToContainerPoint } from "../measure"

// Measuring itself needs a live editor and is covered by the browser test; the
// scroll-aware conversion is pure, and easy to get the sign of wrong.
describe("coordinate conversion", () => {
  const containerRect = { top: 100, left: 50 }
  const scroll = { scrollTop: 40, scrollLeft: 15 }

  it("converts a pointer into scroll-aware container coordinates", () => {
    const result = viewportPointToContainerPoint({
      clientX: 90,
      clientY: 130,
      containerRect,
      ...scroll,
    })

    expect(result).toEqual({ x: 55, y: 70 })
  })
})

describe("reconcileGeometries", () => {
  const rect = (top: number): Rect => ({
    top,
    left: 20,
    width: 300,
    height: 20,
  })

  // Each call builds fresh objects, standing in for a fresh measurement pass.
  const geometry = (pos: number, tops: number[]): TableGeometry => ({
    pos,
    rowRects: tops.map(rect),
    colRects: [rect(tops[0] ?? 0)],
  })

  it("keeps the previous array when nothing moved", () => {
    const previous = [geometry(1, [10, 30]), geometry(9, [100])]
    const next = [geometry(1, [10, 30]), geometry(9, [100])]

    expect(reconcileGeometries(previous, next)).toBe(previous)
  })

  it("keeps the previous array when there are no tables", () => {
    const previous: TableGeometry[] = []

    expect(reconcileGeometries(previous, [])).toBe(previous)
  })

  it("publishes the fresh measurement when any table moved", () => {
    const previous = [geometry(1, [10, 30]), geometry(9, [100])]
    const next = [geometry(1, [10, 30]), geometry(9, [140])]

    expect(reconcileGeometries(previous, next)).toBe(next)
  })

  it("publishes everything fresh when a table is added or removed", () => {
    const previous = [geometry(1, [10])]
    const added = [geometry(1, [10]), geometry(9, [100])]

    expect(reconcileGeometries(previous, added)).toBe(added)
    expect(reconcileGeometries(added, previous)).toBe(previous)
  })

  it("treats a table that changed document position as moved", () => {
    const previous = [geometry(1, [10])]
    const next = [geometry(5, [10])]

    expect(reconcileGeometries(previous, next)[0]).toBe(next[0])
  })

  it("treats a slot becoming unmeasured as a move", () => {
    const previous = [geometry(1, [10, 30])]
    const next: TableGeometry[] = [
      { pos: 1, rowRects: [rect(10), null], colRects: [rect(10)] },
    ]

    expect(reconcileGeometries(previous, next)[0]).toBe(next[0])
  })

  it("treats matching unmeasured slots as unchanged", () => {
    const unmeasured = (): TableGeometry => ({
      pos: 1,
      rowRects: [null, rect(30)],
      colRects: [null],
    })
    const previous = [unmeasured()]

    expect(reconcileGeometries(previous, [unmeasured()])).toBe(previous)
  })

  it("treats a row being added to a table as a move", () => {
    const previous = [geometry(1, [10, 30])]
    const next = [geometry(1, [10, 30, 50])]

    expect(reconcileGeometries(previous, next)[0]).toBe(next[0])
  })
})
