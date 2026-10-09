import type { Rect, TableGeometry } from "../axisMath"
import {
  findHoveredTableCornerPos,
  findHoveredTablePos,
  SELECT_TABLE_CORNER_REACH_PX,
} from "../useHoveredTable"

const CONTAINER_RECT = { top: 100, left: 50 }

const rowsAt = (tops: number[]): Rect[] =>
  tops.map((top) => ({ top, left: 20, width: 300, height: 20 }))

// In viewport coordinates this table spans x 70..370 and y 110..150, so its
// 28px gutter reaches x 42..398 and y 82..178.
const TABLE_A: TableGeometry = {
  pos: 7,
  rowRects: rowsAt([10, 30]),
  colRects: rowsAt([10]),
}

// Further down: viewport y 400..440, gutter y 372..468.
const TABLE_B: TableGeometry = {
  pos: 99,
  rowRects: rowsAt([300, 320]),
  colRects: rowsAt([300]),
}

const hoveredAt = (
  clientX: number,
  clientY: number,
  {
    geometries = [TABLE_A],
    scrollTop = 0,
    scrollLeft = 0,
  }: {
    geometries?: TableGeometry[]
    scrollTop?: number
    scrollLeft?: number
  } = {},
): number | null =>
  findHoveredTablePos({
    geometries,
    clientX,
    clientY,
    containerRect: CONTAINER_RECT,
    scrollTop,
    scrollLeft,
  })

describe("findHoveredTablePos", () => {
  it("finds the table under the pointer", () => {
    expect(hoveredAt(200, 130)).toBe(7)
  })

  it("counts the gutter below and to the right as hovering", () => {
    expect(hoveredAt(200, 178)).toBe(7)
    expect(hoveredAt(398, 130)).toBe(7)
  })

  it("counts the gutter above and to the left as hovering", () => {
    expect(hoveredAt(200, 82)).toBe(7)
    expect(hoveredAt(42, 130)).toBe(7)
  })

  it("stops at the edge of the gutter on every side", () => {
    expect(hoveredAt(200, 179)).toBeNull()
    expect(hoveredAt(399, 130)).toBeNull()
    expect(hoveredAt(200, 81)).toBeNull()
    expect(hoveredAt(41, 130)).toBeNull()
  })

  it("accounts for the container's scroll offset", () => {
    // Scrolled down 40px, the table sits 40px higher in the viewport, so its
    // gutter now ends at y=138 rather than y=178.
    expect(hoveredAt(200, 130, { scrollTop: 40 })).toBe(7)
    expect(hoveredAt(200, 139, { scrollTop: 40 })).toBeNull()
  })

  it("accounts for horizontal scroll too", () => {
    expect(hoveredAt(398, 130, { scrollLeft: 30 })).toBeNull()
    expect(hoveredAt(368, 130, { scrollLeft: 30 })).toBe(7)
  })

  it("picks out the right table when the document has several", () => {
    const geometries = [TABLE_A, TABLE_B]

    expect(hoveredAt(200, 130, { geometries })).toBe(7)
    expect(hoveredAt(200, 400, { geometries })).toBe(99)
  })

  it("hovers nothing in the gap between two tables", () => {
    expect(hoveredAt(200, 250, { geometries: [TABLE_A, TABLE_B] })).toBeNull()
  })

  it("skips a table whose rows have not been measured", () => {
    const unmeasured: TableGeometry = {
      pos: 3,
      rowRects: [null, null],
      colRects: [],
    }

    expect(hoveredAt(200, 130, { geometries: [unmeasured, TABLE_A] })).toBe(7)
  })

  it("hovers nothing when there are no tables", () => {
    expect(hoveredAt(200, 130, { geometries: [] })).toBeNull()
  })
})

// Viewport corner of TABLE_A is (70, 110). The table is only 40px tall, so a
// taller geometry is used where vertical distance matters.
const TALL_TABLE: TableGeometry = {
  pos: 4,
  rowRects: [0, 1, 2].map((index) => ({
    top: 10 + index * 40,
    left: 20,
    width: 300,
    height: 40,
  })),
  colRects: [0, 1, 2].map((index) => ({
    top: 10,
    left: 20 + index * 100,
    width: 100,
    height: 120,
  })),
}

const cornerAt = (
  clientX: number,
  clientY: number,
  geometries: TableGeometry[] = [TALL_TABLE],
): number | null =>
  findHoveredTableCornerPos({
    geometries,
    clientX,
    clientY,
    containerRect: CONTAINER_RECT,
    scrollTop: 0,
    scrollLeft: 0,
  })

describe("findHoveredTableCornerPos", () => {
  it("finds the table when the pointer is on the top-left corner", () => {
    expect(cornerAt(70, 110)).toBe(4)
  })

  it("includes the gutter outside the corner and the reach into the table", () => {
    expect(cornerAt(70 - 4, 110 - 4)).toBe(4)
    expect(cornerAt(70 + SELECT_TABLE_CORNER_REACH_PX, 110)).toBe(4)
    expect(cornerAt(70, 110 + SELECT_TABLE_CORNER_REACH_PX)).toBe(4)
  })

  it("stops at the edge of that box", () => {
    expect(cornerAt(70 - 29, 110)).toBeNull()
    expect(cornerAt(70, 110 - 29)).toBeNull()
    expect(cornerAt(70 + SELECT_TABLE_CORNER_REACH_PX + 1, 110)).toBeNull()
    expect(cornerAt(70, 110 + SELECT_TABLE_CORNER_REACH_PX + 1)).toBeNull()
  })

  it("ignores the rest of the table", () => {
    expect(cornerAt(200, 130)).toBeNull()
    expect(cornerAt(200, 100)).toBeNull()
    expect(cornerAt(78, 200)).toBeNull()
  })

  it("picks the table whose corner contains the pointer", () => {
    expect(cornerAt(78, 118, [TABLE_A, TABLE_B])).toBe(7)
    expect(cornerAt(78, 408, [TABLE_A, TABLE_B])).toBe(99)
  })
})
