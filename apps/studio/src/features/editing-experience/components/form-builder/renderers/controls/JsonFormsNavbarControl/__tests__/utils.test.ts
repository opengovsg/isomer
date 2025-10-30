import type { NavbarItemPath } from "../types"
import {
  getInstancePathFromNavbarItemPath,
  getMoveItemOperation,
  getNavbarItemPath,
  handleMoveItem,
  isSubItemPath,
} from "../utils"

describe("getNavbarItemPath", () => {
  it("should return correct path for top-level item", () => {
    // Arrange
    const index = 2

    // Act
    const actual = getNavbarItemPath(index)

    // Assert
    expect(actual).toBe("items.2")
  })

  it("should return correct path for sub-item", () => {
    // Arrange
    const index = 1
    const parentIndex = 0

    // Act
    const actual = getNavbarItemPath(index, parentIndex)

    // Assert
    expect(actual).toBe("items.0.items.1")
  })
})

describe("isSubItemPath", () => {
  it("should return true for sub-item path", () => {
    // Arrange
    const path = "items.0.items.1"

    // Act
    const actual = isSubItemPath(path)

    // Assert
    expect(actual).toBe(true)
  })

  it("should return false for top-level item path", () => {
    // Arrange
    const path = "items.2"

    // Act
    const actual = isSubItemPath(path)

    // Assert
    expect(actual).toBe(false)
  })

  it("should return false for invalid path", () => {
    // Arrange
    const path = "invalid.path"

    // Act
    const actual = isSubItemPath(path)

    // Assert
    expect(actual).toBe(false)
  })
})

describe("getInstancePathFromNavbarItemPath", () => {
  it("should convert navbar item path to instance path for top-level item", () => {
    // Arrange
    const path = "items.3" as NavbarItemPath

    // Act
    const actual = getInstancePathFromNavbarItemPath(path)

    // Assert
    expect(actual).toBe("/items/3")
  })

  it("should convert navbar item path to instance path for sub-item", () => {
    // Arrange
    const path = "items.1.items.4" as NavbarItemPath

    // Act
    const actual = getInstancePathFromNavbarItemPath(path)

    // Assert
    expect(actual).toBe("/items/1/items/4")
  })
})

describe("getMoveItemOperation", () => {
  it("should return correct operation for reordering within the same subitem", () => {
    // Arrange
    const originalPath = "items.2.items.1"
    const newPath = "items.2.items.3"

    // Act
    const actual = getMoveItemOperation(originalPath, newPath)
    const actualReorderBefore = getMoveItemOperation(
      originalPath,
      newPath,
      "reorder-before",
    )
    const actualReorderAfter = getMoveItemOperation(
      originalPath,
      newPath,
      "reorder-after",
    )

    // Assert
    expect(actual).toBe("ReorderWithinSameList")
    expect(actualReorderBefore).toBe("ReorderWithinSameList")
    expect(actualReorderAfter).toBe("ReorderWithinSameList")
  })

  it("should return correct operation for reordering top-level items", () => {
    // Arrange
    const originalPath = "items.1"
    const newPath = "items.4"

    // Act
    const actual = getMoveItemOperation(originalPath, newPath)
    const actualReorderBefore = getMoveItemOperation(
      originalPath,
      newPath,
      "reorder-before",
    )
    const actualReorderAfter = getMoveItemOperation(
      originalPath,
      newPath,
      "reorder-after",
    )

    // Assert
    expect(actual).toBe("ReorderMainItems")
    expect(actualReorderBefore).toBe("ReorderMainItems")
    expect(actualReorderAfter).toBe("ReorderMainItems")
  })

  it("should return correct operation for a subitem to become a main item", () => {
    // Arrange
    const originalPath = "items.2.items.1"
    const newPath = "items.4"

    // Act
    const actual = getMoveItemOperation(originalPath, newPath)
    const actualReorderBefore = getMoveItemOperation(
      originalPath,
      newPath,
      "reorder-before",
    )
    const actualReorderAfter = getMoveItemOperation(
      originalPath,
      newPath,
      "reorder-after",
    )

    // Assert
    expect(actual).toBe("MoveSubitemToBecomeMainItem")
    expect(actualReorderBefore).toBe("MoveSubitemToBecomeMainItem")
    expect(actualReorderAfter).toBe("MoveSubitemToBecomeMainItem")
  })

  it("should return correct operation for combining a subitem to an unexpanded main item", () => {
    // Arrange
    const originalPath = "items.1.items.2"
    const newPath = "items.3"

    // Act
    const actual = getMoveItemOperation(originalPath, newPath, "combine")

    // Assert
    expect(actual).toBe("CombineSubitemToMainItem")
  })

  it("should return correct operation for combining a subitem to an expanded main item", () => {
    // Arrange
    const originalPath = "items.0.items.1"
    const newPath = "items.4.items.3"

    // Act
    const actual = getMoveItemOperation(originalPath, newPath)

    // Assert
    expect(actual).toBe("CombineSubitemToMainItem")
  })

  it("should return correct operation for moving a main item to become a subitem of an unexpanded main item", () => {
    // Arrange
    const originalPath = "items.2"
    const newPath = "items.5"

    // Act
    const actual = getMoveItemOperation(originalPath, newPath, "combine")

    // Assert
    expect(actual).toBe("MoveSingleMainItemToBecomeSubitem")
  })

  it("should return correct operation for moving a main item to become a subitem of an expanded main item", () => {
    // Arrange
    const originalPath = "items.3"
    const newPath = "items.2.items.0"

    // Act
    const actual = getMoveItemOperation(originalPath, newPath)

    // Assert
    expect(actual).toBe("MoveSingleMainItemToBecomeSubitem")
  })

  it("should return 'InvalidMove' for invalid move operations", () => {
    // Arrange
    const originalPath = "items.1.items.2"
    const newPath = "items.3.items.4"

    // Act
    const actual = getMoveItemOperation(originalPath, newPath, "combine")

    // Assert
    expect(actual).toBe("InvalidMove")
  })
})

describe("handleMoveItem", () => {
  it("should handle moving a single main item to become a subitem correctly", () => {
    // Arrange
    const prevData = [
      { name: "Item 1", url: "/item1" },
      { name: "Item 2", url: "/item2" },
      { name: "Item 3", url: "/item3" },
    ]
    const isMaxItemsReached = false
    const originalPath = "items.2"
    const newPath = "items.0"
    const instruction = "combine"
    const closestEdge = "top"

    // Act
    const actual = handleMoveItem(
      prevData,
      isMaxItemsReached,
      originalPath,
      newPath,
      instruction,
      closestEdge,
    )

    // Assert
    const expected = [
      {
        name: "Item 1",
        url: "/item1",
        items: [{ name: "Item 3", url: "/item3" }],
      },
      { name: "Item 2", url: "/item2" },
    ]
    expect(actual).toEqual(expected)
  })

  it("should handle moving a subitem into another main item correctly", () => {
    // Arrange
    const prevData = [
      {
        name: "Item 1",
        url: "/item1",
        items: [
          { name: "Subitem 1-1", url: "/item1/subitem1" },
          { name: "Subitem 1-2", url: "/item1/subitem2" },
        ],
      },
      { name: "Item 2", url: "/item2" },
    ]
    const isMaxItemsReached = false
    const originalPath = "items.0.items.1"
    const newPath = "items.1"
    const instruction = "combine"
    const closestEdge = "bottom"

    // Act
    const actual = handleMoveItem(
      prevData,
      isMaxItemsReached,
      originalPath,
      newPath,
      instruction,
      closestEdge,
    )

    // Assert
    const expected = [
      {
        name: "Item 1",
        url: "/item1",
        items: [{ name: "Subitem 1-1", url: "/item1/subitem1" }],
      },
      {
        name: "Item 2",
        url: "/item2",
        items: [{ name: "Subitem 1-2", url: "/item1/subitem2" }],
      },
    ]
    expect(actual).toEqual(expected)
  })

  it("should handle reordering subitems within the same main item correctly", () => {
    // Arrange
    const prevData = [
      {
        name: "Item 1",
        url: "/item1",
        items: [
          { name: "Subitem 1-1", url: "/item1/subitem1" },
          { name: "Subitem 1-2", url: "/item1/subitem2" },
          { name: "Subitem 1-3", url: "/item1/subitem3" },
        ],
      },
      { name: "Item 2", url: "/item2" },
    ]
    const isMaxItemsReached = false
    const originalPath = "items.0.items.0"
    const newPath = "items.0.items.2"
    const instruction = "reorder-after"
    const closestEdge = "bottom"

    // Act
    const actual = handleMoveItem(
      prevData,
      isMaxItemsReached,
      originalPath,
      newPath,
      instruction,
      closestEdge,
    )

    // Assert
    const expected = [
      {
        name: "Item 1",
        url: "/item1",
        items: [
          { name: "Subitem 1-2", url: "/item1/subitem2" },
          { name: "Subitem 1-3", url: "/item1/subitem3" },
          { name: "Subitem 1-1", url: "/item1/subitem1" },
        ],
      },
      { name: "Item 2", url: "/item2" },
    ]
    expect(actual).toEqual(expected)
  })

  it("should handle reordering main items correctly", () => {
    // Arrange
    const prevData = [
      { name: "Item 1", url: "/item1" },
      { name: "Item 2", url: "/item2" },
      { name: "Item 3", url: "/item3" },
    ]
    const isMaxItemsReached = false
    const originalPath = "items.0"
    const newPath = "items.2"
    const instruction = "reorder-after"
    const closestEdge = "bottom"

    // Act
    const actual = handleMoveItem(
      prevData,
      isMaxItemsReached,
      originalPath,
      newPath,
      instruction,
      closestEdge,
    )

    // Assert
    const expected = [
      { name: "Item 2", url: "/item2" },
      { name: "Item 3", url: "/item3" },
      { name: "Item 1", url: "/item1" },
    ]
    expect(actual).toEqual(expected)
  })

  it("should handle moving subitems to become main items correctly", () => {
    // Arrange
    const prevData = [
      {
        name: "Item 1",
        url: "/item1",
        items: [
          { name: "Subitem 1-1", url: "/item1/subitem1" },
          { name: "Subitem 1-2", url: "/item1/subitem2" },
        ],
      },
      { name: "Item 2", url: "/item2" },
    ]
    const isMaxItemsReached = false
    const originalPath = "items.0.items.0"
    const newPath = "items.1"
    const instruction = "reorder-before"
    const closestEdge = "top"

    // Act
    const actual = handleMoveItem(
      prevData,
      isMaxItemsReached,
      originalPath,
      newPath,
      instruction,
      closestEdge,
    )

    // Assert
    const expected = [
      {
        name: "Item 1",
        url: "/item1",
        items: [{ name: "Subitem 1-2", url: "/item1/subitem2" }],
      },
      { name: "Subitem 1-1", url: "/item1/subitem1" },
      { name: "Item 2", url: "/item2" },
    ]
    expect(actual).toEqual(expected)
  })

  it("should not move subitems to become main items if maxItems is reached", () => {
    // Arrange
    const prevData = [
      {
        name: "Item 1",
        url: "/item1",
        items: [
          { name: "Subitem 1-1", url: "/item1/subitem1" },
          { name: "Subitem 1-2", url: "/item1/subitem2" },
        ],
      },
      { name: "Item 2", url: "/item2" },
      { name: "Item 3", url: "/item3" },
      { name: "Item 4", url: "/item4" },
      { name: "Item 5", url: "/item5" },
      { name: "Item 6", url: "/item6" },
      { name: "Item 7", url: "/item7" },
      { name: "Item 8", url: "/item8" },
    ]
    const isMaxItemsReached = true
    const originalPath = "items.0.items.0"
    const newPath = "items.3"
    const instruction = "reorder-before"
    const closestEdge = "top"

    // Act
    const actual = handleMoveItem(
      prevData,
      isMaxItemsReached,
      originalPath,
      newPath,
      instruction,
      closestEdge,
    )

    // Assert
    expect(actual).toEqual(prevData)
  })

  it("should not change data for invalid move operations", () => {
    // Arrange
    const prevData = [
      {
        name: "Item 1",
        url: "/item1",
        items: [
          { name: "Subitem 1-1", url: "/item1/subitem1" },
          { name: "Subitem 1-2", url: "/item1/subitem2" },
        ],
      },
      { name: "Item 2", url: "/item2" },
    ]
    const isMaxItemsReached = false
    const originalPath = "items.0.items.0"
    const newPath = "items.1.items.1"
    const instruction = "combine" // Invalid for this case
    const closestEdge = "bottom"

    // Act
    const actual = handleMoveItem(
      prevData,
      isMaxItemsReached,
      originalPath,
      newPath,
      instruction,
      closestEdge,
    )

    // Assert
    expect(actual).toEqual(prevData)
  })
})
