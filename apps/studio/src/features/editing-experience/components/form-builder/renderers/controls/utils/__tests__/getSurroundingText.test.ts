import { getSurroundingText } from "../getSurroundingText"

describe("getSurroundingText", () => {
  it("joins the component's non-empty text fields", () => {
    // Arrange
    const component = {
      title: "Budget 2026",
      caption: "Chart of spending",
      count: 3,
    }

    // Act
    const result = getSurroundingText(component)

    // Assert
    expect(result).toBe("Budget 2026 Chart of spending")
  })

  it("leaves out src, alt, and type", () => {
    // Arrange
    const component = {
      src: "/1/uuid/photo.png",
      alt: "Existing alt",
      type: "image",
      caption: "Team photo",
    }

    // Act
    const result = getSurroundingText(component)

    // Assert
    expect(result).toBe("Team photo")
  })

  it("returns undefined when the component has no prose", () => {
    // Arrange
    const component = { src: "/1/uuid/photo.png", caption: "   " }

    // Act
    const result = getSurroundingText(component)

    // Assert
    expect(result).toBeUndefined()
  })

  it("returns undefined when there is no component", () => {
    // Arrange / Act
    const result = getSurroundingText(undefined)

    // Assert
    expect(result).toBeUndefined()
  })
})
