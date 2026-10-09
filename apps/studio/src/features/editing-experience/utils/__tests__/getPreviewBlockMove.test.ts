import type { IsomerSchema } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import {
  getPreviewBlockMove,
  reorderBlocks,
  shiftIndexAfterMove,
} from "../getPreviewBlockMove"

const page = (
  layout: IsomerSchema["layout"],
  types: string[],
): Pick<IsomerSchema, "layout" | "content"> => ({
  layout,
  content: types.map((type) => ({ type })) as IsomerSchema["content"],
})

const move = (
  layout: IsomerSchema["layout"],
  types: string[],
  index: number,
  overrides?: { isReorderBlocked?: boolean; savedTypes?: string[] },
) =>
  getPreviewBlockMove({
    page: page(layout, types),
    savedContent: (overrides?.savedTypes ?? types).map((type) => ({ type })),
    index,
    isReorderBlocked: overrides?.isReorderBlocked ?? false,
  })

describe("getPreviewBlockMove", () => {
  it("disables moving the first block up and the last block down", () => {
    // Arrange / Act
    const first = move("content", ["prose", "infopic", "infocols"], 0)
    const middle = move("content", ["prose", "infopic", "infocols"], 1)
    const last = move("content", ["prose", "infopic", "infocols"], 2)

    // Assert
    expect(first).toEqual({
      showMoveControls: true,
      canMoveUp: false,
      canMoveDown: true,
    })
    expect(middle).toEqual({
      showMoveControls: true,
      canMoveUp: true,
      canMoveDown: true,
    })
    expect(last).toEqual({
      showMoveControls: true,
      canMoveUp: true,
      canMoveDown: false,
    })
  })

  it("disables both directions when a block is the only one on the page", () => {
    // Arrange / Act
    const result = move("article", ["prose"], 0)

    // Assert
    expect(result).toEqual({
      showMoveControls: true,
      canMoveUp: false,
      canMoveDown: false,
    })
  })

  it("keeps a homepage hero fixed and blocks the block under it from moving up", () => {
    // Arrange
    const types = ["hero", "prose", "infopic"]

    // Act
    const hero = move("homepage", types, 0)
    const underHero = move("homepage", types, 1)
    const last = move("homepage", types, 2)

    // Assert
    expect(hero).toEqual({
      showMoveControls: true,
      canMoveUp: false,
      canMoveDown: false,
    })
    expect(underHero).toEqual({
      showMoveControls: true,
      canMoveUp: false,
      canMoveDown: true,
    })
    expect(last).toEqual({
      showMoveControls: true,
      canMoveUp: true,
      canMoveDown: false,
    })
  })

  it("treats the only block under a homepage hero as immovable", () => {
    // Arrange / Act
    const result = move("homepage", ["hero", "prose"], 1)

    // Assert
    expect(result).toEqual({
      showMoveControls: true,
      canMoveUp: false,
      canMoveDown: false,
    })
  })

  it("hides move controls on layouts that cannot reorder blocks", () => {
    // Arrange / Act
    const collection = move("collection", ["prose", "infopic"], 1)
    const search = move("search", ["prose", "infopic"], 1)
    const link = move("link", ["prose", "infopic"], 1)

    // Assert
    expect(collection.showMoveControls).toBe(false)
    expect(search.showMoveControls).toBe(false)
    expect(link.showMoveControls).toBe(false)
  })

  it("hides move controls when a reorder would not match the saved page", () => {
    // Arrange / Act
    const blocked = move("content", ["prose", "infopic"], 1, {
      isReorderBlocked: true,
    })
    const lengthMismatch = move("content", ["prose", "infopic"], 1, {
      savedTypes: ["prose"],
    })
    const typeMismatch = move("content", ["prose", "infopic"], 1, {
      savedTypes: ["prose", "accordion"],
    })
    const outOfRange = move("content", ["prose"], 3)

    // Assert
    expect(blocked.showMoveControls).toBe(false)
    expect(lengthMismatch.showMoveControls).toBe(false)
    expect(typeMismatch.showMoveControls).toBe(false)
    expect(outOfRange.showMoveControls).toBe(false)
  })
})

describe("reorderBlocks", () => {
  it("moves a block up and down without mutating the original list", () => {
    // Arrange
    const blocks = ["hero", "prose", "infopic"]

    // Act
    const movedUp = reorderBlocks(blocks, 2, 1)
    const movedDown = reorderBlocks(blocks, 0, 1)

    // Assert
    expect(movedUp).toEqual(["hero", "infopic", "prose"])
    expect(movedDown).toEqual(["prose", "hero", "infopic"])
    expect(blocks).toEqual(["hero", "prose", "infopic"])
  })

  it("returns a copy when the move is out of range", () => {
    // Arrange
    const blocks = ["prose"]

    // Act
    const result = reorderBlocks(blocks, 0, 1)

    // Assert
    expect(result).toEqual(["prose"])
    expect(result).not.toBe(blocks)
  })
})

describe("shiftIndexAfterMove", () => {
  it("follows the moved block and shifts the blocks it passes", () => {
    // Arrange / Act
    const moved = shiftIndexAfterMove(2, 2, 1)
    const passed = shiftIndexAfterMove(1, 2, 1)
    const untouched = shiftIndexAfterMove(0, 2, 1)

    // Assert
    expect(moved).toBe(1)
    expect(passed).toBe(2)
    expect(untouched).toBe(0)
  })
})
