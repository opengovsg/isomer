import { describe, expect, it } from "vitest"

import {
  getCollectionItems,
  getReferenceLinkHref,
  getSitemapAsArray,
} from "../index"

// This entrypoint exists so build-time scripts (the RSS generator) can reuse the
// collection utilities without importing the React barrel. If any of these stop
// being exported, the generator breaks — so assert the surface here.
describe("build entrypoint", () => {
  it("re-exports the pure collection build utilities", () => {
    // Arrange / Act / Assert
    expect(typeof getCollectionItems).toBe("function")
    expect(typeof getReferenceLinkHref).toBe("function")
    expect(typeof getSitemapAsArray).toBe("function")
  })
})
