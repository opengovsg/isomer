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

  it("returns the sibling imageAlt field for an imageSrc path", () => {
    // Arrange
    const srcPath = "imageSrc"

    // Act
    const result = getImageFieldPaths(srcPath)

    // Assert
    expect(result).toEqual({
      parentPath: "",
      altPath: "imageAlt",
    })
  })

  it("returns the sibling imageAlt field for an imageUrl path", () => {
    // Arrange
    const srcPath = "cards.0.imageUrl"

    // Act
    const result = getImageFieldPaths(srcPath)

    // Assert
    expect(result).toEqual({
      parentPath: "cards.0",
      altPath: "cards.0.imageAlt",
    })
  })

  it("returns no alt path when the control is not an image field", () => {
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
