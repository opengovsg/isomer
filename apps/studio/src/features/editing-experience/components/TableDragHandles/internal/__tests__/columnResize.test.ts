import { describe, expect, it } from "vitest"

import type { TableGeometry } from "../axisMath"
import { getColumnBoundaryTargets, hitColumnBoundary } from "../columnResize"

describe("column resize boundaries", () => {
  const geometry: TableGeometry = {
    pos: 1,
    rowRects: [{ top: 10, left: 0, width: 300, height: 40 }],
    colRects: [
      { top: 10, left: 0, width: 100, height: 40 },
      { top: 10, left: 100, width: 200, height: 40 },
    ],
  }

  it("places boundaries on trailing column edges", () => {
    expect(getColumnBoundaryTargets(geometry)).toEqual([
      {
        tablePos: 1,
        columnIndex: 0,
        lineLeft: 100,
        top: 10,
        height: 40,
      },
      {
        tablePos: 1,
        columnIndex: 1,
        lineLeft: 300,
        top: 10,
        height: 40,
      },
    ])
  })

  it("detects pointer hits within the grip band", () => {
    const targets = getColumnBoundaryTargets(geometry)
    expect(
      hitColumnBoundary({ targets, x: 100, y: 20 }),
    ).toMatchObject({ columnIndex: 0 })
    expect(hitColumnBoundary({ targets, x: 50, y: 20 })).toBeNull()
  })
})
