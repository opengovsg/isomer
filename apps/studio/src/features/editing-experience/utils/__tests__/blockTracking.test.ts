import { beforeEach, describe, expect, it, vi } from "vitest"
import { captureSiteEvent } from "~/lib/posthogCapture"

import {
  captureBlockAdded,
  captureBlockReordered,
  getBlockAddedProperties,
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

describe("getBlockAddedProperties", () => {
  it("reports the source, block and 1-based position", () => {
    expect(
      getBlockAddedProperties({
        source: "top_button",
        index: 2,
        blocks: BLOCKS,
      }),
    ).toEqual({
      source: "top_button",
      block_type: "callout",
      position: 3,
      block_count: 3,
    })
  })
})

describe("captureBlockAdded", () => {
  beforeEach(() => {
    vi.mocked(captureSiteEvent).mockClear()
  })

  it("captures block_added for the site", () => {
    captureBlockAdded(7, { source: "empty_state", index: 0, blocks: BLOCKS })

    expect(captureSiteEvent).toHaveBeenCalledWith("block_added", 7, {
      source: "empty_state",
      block_type: "prose",
      position: 1,
      block_count: 3,
    })
  })

  it("skips saves of a block that was not just added", () => {
    captureBlockAdded(7, { source: "top_button", index: null, blocks: BLOCKS })
    captureBlockAdded(7, { source: null, index: 1, blocks: BLOCKS })

    expect(captureSiteEvent).not.toHaveBeenCalled()
  })
})
