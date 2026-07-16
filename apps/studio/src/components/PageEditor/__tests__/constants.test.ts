import { describe, expect, it } from "vitest"

import { TYPE_TO_ICON } from "~/features/editing-experience/constants"
import {
  ARTICLE_ALLOWED_BLOCKS,
  BLOCK_TO_META,
  CONTENT_ALLOWED_BLOCKS,
  DATABASE_ALLOWED_BLOCKS,
  DEFAULT_BLOCKS,
  HOMEPAGE_ALLOWED_BLOCKS,
} from "../constants"

const ALL_LISTS = {
  ARTICLE_ALLOWED_BLOCKS,
  CONTENT_ALLOWED_BLOCKS,
  DATABASE_ALLOWED_BLOCKS,
  HOMEPAGE_ALLOWED_BLOCKS,
}

describe("PageEditor allowed-blocks constants", () => {
  it.each(Object.entries(ALL_LISTS))(
    "%s offers the canvas block",
    (_name, sections) => {
      const types = sections.flatMap((section) => section.types)
      expect(types).toContain("canvas")
    },
  )

  it.each(Object.entries(ALL_LISTS))(
    "%s only lists types the ComponentSelector can render and insert",
    (_name, sections) => {
      for (const type of sections.flatMap((section) => section.types)) {
        expect(BLOCK_TO_META[type], `BLOCK_TO_META.${type}`).toBeDefined()
        expect(TYPE_TO_ICON[type], `TYPE_TO_ICON.${type}`).toBeDefined()
        expect(DEFAULT_BLOCKS[type], `DEFAULT_BLOCKS.${type}`).toBeDefined()
      }
    },
  )

  it("inserts a canvas with an empty, resizable-ready default block", () => {
    expect(DEFAULT_BLOCKS.canvas).toMatchObject({ type: "canvas", blocks: [] })
  })
})
