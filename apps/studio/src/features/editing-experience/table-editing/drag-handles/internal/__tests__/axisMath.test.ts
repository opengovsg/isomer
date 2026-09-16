import type { AxisProjection, Rect, TableGeometry } from "../axisMath"
import {
  collectAxisBoundaries,
  geometryAt,
  getTableBounds,
  nearestBoundaryIndex,
  resolveDropIndex,
} from "../axisMath"

// Local literals rather than the real `AXIS_VIEW` descriptors, so this test
// needs neither ProseMirror nor a DOM. `AxisView extends AxisProjection`, so
// the typechecker already guarantees the real descriptors fit here.
const ROW: AxisProjection = {
  rectsOf: (geometry) => geometry.rowRects,
  startOf: (rect) => rect.top,
  sizeOf: (rect) => rect.height,
  pointerOf: (point) => point.y,
}

const COLUMN: AxisProjection = {
  rectsOf: (geometry) => geometry.colRects,
  startOf: (rect) => rect.left,
  sizeOf: (rect) => rect.width,
  pointerOf: (point) => point.x,
}

// A 4-row × 3-column table: rows are 20px tall from y=100, columns 100px wide
// from x=50. Every expectation below is derived from these numbers.
const ROW_RECTS: Rect[] = [100, 120, 140, 160].map((top) => ({
  top,
  left: 50,
  width: 300,
  height: 20,
}))

const COL_RECTS: Rect[] = [50, 150, 250].map((left) => ({
  top: 100,
  left,
  width: 100,
  height: 20,
}))

const GEOMETRY: TableGeometry = {
  pos: 7,
  rowRects: ROW_RECTS,
  colRects: COL_RECTS,
}

// Boundaries for the row axis of GEOMETRY, unlocked and header-locked.
const UNLOCKED_BOUNDARIES = [100, 120, 140, 160, 180]
const LOCKED_BOUNDARIES = [120, 140, 160, 180]

describe("collectAxisBoundaries", () => {
  it("collects the leading edge of the first slot then every trailing edge", () => {
    expect(collectAxisBoundaries(ROW_RECTS, 0, ROW)).toEqual(
      UNLOCKED_BOUNDARIES,
    )
  })

  it("omits boundaries inside a locked header axis", () => {
    expect(collectAxisBoundaries(ROW_RECTS, 1, ROW)).toEqual(LOCKED_BOUNDARIES)
  })

  it("reads the other coordinate for the column axis", () => {
    expect(collectAxisBoundaries(COL_RECTS, 0, COLUMN)).toEqual([
      50, 150, 250, 350,
    ])
    expect(collectAxisBoundaries(COL_RECTS, 1, COLUMN)).toEqual([150, 250, 350])
  })

  it("skips unmeasured slots", () => {
    const rects = [ROW_RECTS[0]!, null, ROW_RECTS[2]!]

    // The null row contributes nothing, so only two trailing edges survive
    // alongside the first slot's leading edge.
    expect(collectAxisBoundaries(rects, 0, ROW)).toEqual([100, 120, 160])
  })

  it("has no leading edge when the first movable slot is unmeasured", () => {
    const rects = [null, ROW_RECTS[1]!, ROW_RECTS[2]!]

    expect(collectAxisBoundaries(rects, 0, ROW)).toEqual([140, 160])
  })

  it("returns nothing for a table with no measured slots", () => {
    expect(collectAxisBoundaries([null, null], 0, ROW)).toEqual([])
    expect(collectAxisBoundaries([], 0, ROW)).toEqual([])
  })
})

describe("nearestBoundaryIndex", () => {
  it("finds the closest boundary", () => {
    expect(nearestBoundaryIndex(105, UNLOCKED_BOUNDARIES)).toBe(0)
    expect(nearestBoundaryIndex(131, UNLOCKED_BOUNDARIES)).toBe(2)
    expect(nearestBoundaryIndex(1000, UNLOCKED_BOUNDARIES)).toBe(4)
    expect(nearestBoundaryIndex(-1000, UNLOCKED_BOUNDARIES)).toBe(0)
  })

  it("resolves an exact tie towards the earlier boundary", () => {
    expect(nearestBoundaryIndex(130, UNLOCKED_BOUNDARIES)).toBe(1)
  })

  it("falls back to the first index when there are no boundaries", () => {
    expect(nearestBoundaryIndex(130, [])).toBe(0)
  })
})

describe("resolveDropIndex", () => {
  describe("on an axis with no header", () => {
    // prettier-ignore
    const cases: [description: string, from: number, pointer: number, expected: number][] = [
      ["drags the first slot to the very end",        0, 175, 3],
      ["drags the last slot to the very start",       3, 105, 0],
      ["drags a middle slot up past one neighbour",   2, 105, 0],
      ["drops onto its own leading edge",             1, 125, 1],
      ["drops onto its own trailing edge",            1, 145, 1],
      ["drops one slot further down",                 1, 165, 2],
      ["drops onto the edge just after itself",       0, 125, 0],
    ]

    it.each(cases)("%s", (_description, from, pointer, expected) => {
      expect(
        resolveDropIndex({
          pointer,
          boundaries: UNLOCKED_BOUNDARIES,
          from,
          lockMinIndex: 0,
        }),
      ).toBe(expected)
    })
  })

  describe("on an axis with a locked header", () => {
    // prettier-ignore
    const cases: [description: string, from: number, pointer: number, expected: number][] = [
      ["never lands on the header",                     1, 115, 1],
      ["clamps a drag from the end above the header",    3, 100, 1],
      ["drags the first movable slot to the very end",   1, 185, 3],
      ["drags a middle slot up to just below the header",2, 125, 1],
      ["drops onto its own trailing edge",               3, 165, 3],
      ["drops one slot further up",                      3, 145, 2],
    ]

    it.each(cases)("%s", (_description, from, pointer, expected) => {
      expect(
        resolveDropIndex({
          pointer,
          boundaries: LOCKED_BOUNDARIES,
          from,
          lockMinIndex: 1,
        }),
      ).toBe(expected)
    })
  })

  it("stays on the locked floor when nothing was measured", () => {
    expect(
      resolveDropIndex({
        pointer: 130,
        boundaries: [],
        from: 2,
        lockMinIndex: 1,
      }),
    ).toBe(1)
  })
})

describe("geometryAt", () => {
  const other: TableGeometry = { ...GEOMETRY, pos: 42 }

  it("finds the geometry for a table position", () => {
    expect(geometryAt([other, GEOMETRY], GEOMETRY.pos)).toBe(GEOMETRY)
  })

  it("returns null when that table is not measured", () => {
    expect(geometryAt([other], GEOMETRY.pos)).toBeNull()
    expect(geometryAt([], GEOMETRY.pos)).toBeNull()
  })
})

describe("getTableBounds", () => {
  it("spans the first and last measured row and column", () => {
    expect(getTableBounds(GEOMETRY)).toEqual({
      left: 50,
      top: 100,
      width: 300,
      height: 80,
    })
  })

  it("spans the outermost measured slots when one is missing", () => {
    const bounds = getTableBounds({
      ...GEOMETRY,
      rowRects: [ROW_RECTS[0]!, null, ROW_RECTS[3]!],
    })

    expect(bounds).toEqual({ left: 50, top: 100, width: 300, height: 80 })
  })

  it("returns null when an axis has nothing measured", () => {
    expect(getTableBounds({ ...GEOMETRY, rowRects: [null] })).toBeNull()
    expect(getTableBounds({ ...GEOMETRY, colRects: [] })).toBeNull()
  })

  it("collapses to a single slot's size for a one-row, one-column table", () => {
    const bounds = getTableBounds({
      ...GEOMETRY,
      rowRects: [ROW_RECTS[0]!],
      colRects: [COL_RECTS[0]!],
    })

    expect(bounds).toEqual({ left: 50, top: 100, width: 100, height: 20 })
  })
})
