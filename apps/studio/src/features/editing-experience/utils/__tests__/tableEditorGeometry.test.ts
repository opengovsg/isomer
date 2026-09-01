import {
  containerRectToViewportRect,
  viewportPointToContainerPoint,
  viewportRectToContainerRect,
} from "~/features/editing-experience/utils/tableEditorGeometry"

describe("tableEditorGeometry", () => {
  const containerRect = { top: 100, left: 50 }
  const scroll = { scrollTop: 40, scrollLeft: 15 }

  it("converts a viewport rect into scroll-aware container coordinates", () => {
    // Arrange
    const viewportRect = {
      top: 130,
      left: 90,
      width: 200,
      height: 30,
    }

    // Act
    const result = viewportRectToContainerRect({
      rect: viewportRect,
      containerRect,
      ...scroll,
    })

    // Assert
    expect(result).toEqual({
      top: 70,
      left: 55,
      width: 200,
      height: 30,
    })
  })

  it("converts a container rect back into viewport coordinates", () => {
    // Arrange
    const rect = { top: 70, left: 55, width: 200, height: 30 }

    // Act
    const result = containerRectToViewportRect({
      rect,
      containerRect,
      ...scroll,
    })

    // Assert
    expect(result).toEqual({
      top: 130,
      left: 90,
      width: 200,
      height: 30,
    })
  })

  it("converts a pointer into the same scroll-aware container coordinates", () => {
    // Arrange / Act
    const result = viewportPointToContainerPoint({
      clientX: 90,
      clientY: 130,
      containerRect,
      ...scroll,
    })

    // Assert
    expect(result).toEqual({ x: 55, y: 70 })
  })
})
