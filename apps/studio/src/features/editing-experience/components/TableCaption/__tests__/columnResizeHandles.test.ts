import { describe, expect, it } from "vitest"

import { columnBoundaryLefts } from "../columnResizeHandles"

describe("columnBoundaryLefts", () => {
  it("places a boundary on the trailing edge of every column", () => {
    expect(columnBoundaryLefts([120, 160, 200])).toEqual([120, 280, 480])
  })
})
