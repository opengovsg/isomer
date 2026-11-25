import { beforeEach, describe, expect, it, vi } from "vitest"
import { captureSiteEvent } from "~/lib/posthogCapture"

import {
  captureBlockReordered,
  getBlockReorderedProperties,
} from "../blockTracking"

vi.mock("~/lib/posthogCapture", () => ({ captureSiteEvent: vi.fn() }))

const BLOCKS = [{ type: "prose" }, { type: "image" }, { type: "callout" }]

describe("getBlockReorderedProperties", () => {
  it("reports the moved block and 1-based positions", () => {
    expect(
      getBlockReorderedProperties({ from: 2, to: 0, blocks: BLOCKS }),
    ).toEqual({
      block_type: "callout",
      from_position: 3,
      to_position: 1,
      block_count: 3,
    })
  })
})

describe("captureBlockReordered", () => {
  beforeEach(() => {
    vi.mocked(captureSiteEvent).mockClear()
  })

  it("captures block_reordered for the site", () => {
    captureBlockReordered(7, { from: 0, to: 2, blocks: BLOCKS })

    expect(captureSiteEvent).toHaveBeenCalledWith("block_reordered", 7, {
      block_type: "prose",
      from_position: 1,
      to_position: 3,
      block_count: 3,
    })
  })

  it("skips a drop back onto the same position", () => {
    captureBlockReordered(7, { from: 1, to: 1, blocks: BLOCKS })

    expect(captureSiteEvent).not.toHaveBeenCalled()
  })
})
