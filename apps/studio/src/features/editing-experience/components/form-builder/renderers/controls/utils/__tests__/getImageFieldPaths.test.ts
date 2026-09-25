import { getImageFieldPaths } from "../getImageFieldPaths"

describe("getImageFieldPaths", () => {
  it("returns the parent object and the sibling alt field for a src path", () => {
    // Arrange
    const srcPath = "content.2.src"

    // Act
    const result = getImageFieldPaths(srcPath)

    // Assert
    expect(result).toEqual({
      parentPath: "content.2",
      altPath: "content.2.alt",
    })
  })

  it("returns alt at the root when src is the whole path", () => {
    // Arrange
    const srcPath = "src"

    // Act
    const result = getImageFieldPaths(srcPath)

    // Assert
    expect(result).toEqual({
      parentPath: "",
      altPath: "alt",
    })
  })

  it("returns no alt path when the control is not bound to src", () => {
    // Arrange
    const srcPath = "content.2.image"

    // Act
    const result = getImageFieldPaths(srcPath)

    // Assert
    expect(result).toEqual({
      parentPath: "content.2",
      altPath: undefined,
    })
  })
})
