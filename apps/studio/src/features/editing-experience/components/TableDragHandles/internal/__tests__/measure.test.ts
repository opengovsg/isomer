import {
  containerRectToViewportRect,
  viewportPointToContainerPoint,
} from "../measure"

// Measuring itself needs a live editor and is covered by the browser test; the
// scroll-aware conversions are pure, and easy to get the sign of wrong.
describe("coordinate conversion", () => {
  const containerRect = { top: 100, left: 50 }
  const scroll = { scrollTop: 40, scrollLeft: 15 }

  it("converts a container rect back into viewport coordinates", () => {
    const result = containerRectToViewportRect({
      rect: { top: 70, left: 55, width: 200, height: 30 },
      containerRect,
      ...scroll,
    })

    expect(result).toEqual({ top: 130, left: 90, width: 200, height: 30 })
  })

  it("converts a pointer into scroll-aware container coordinates", () => {
    const result = viewportPointToContainerPoint({
      clientX: 90,
      clientY: 130,
      containerRect,
      ...scroll,
    })

    expect(result).toEqual({ x: 55, y: 70 })
  })
})
