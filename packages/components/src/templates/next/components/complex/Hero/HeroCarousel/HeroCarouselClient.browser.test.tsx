import { fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"

import { HeroCarouselClient } from "./HeroCarouselClient"
import { HeroCarouselPreviewProvider } from "./HeroCarouselPreviewContext"

const shortSlide = {
  backgroundUrl: "/short.png",
  title: "Short",
  subtitle: "One line.",
  primaryLabel: "Start",
  primaryHref: "/",
}

const tallSlide = {
  backgroundUrl: "/tall.png",
  title: "A much longer title that wraps across many lines ".repeat(8),
  subtitle: "Extra subtitle copy that also wraps onto more lines. ".repeat(6),
  primaryLabel: "Continue",
  primaryHref: "/",
  secondaryLabel: "Details",
  secondaryHref: "/",
}

const renderCarousel = (isBlock: boolean) => {
  const view = render(
    <HeroCarouselClient
      isBlock={isBlock}
      headingTag="h1"
      slides={[shortSlide, tallSlide]}
    />,
  )
  const section = view.container.querySelector("section")
  if (!section) {
    throw new Error("Expected a carousel section")
  }
  return section
}

describe("HeroCarouselClient", () => {
  it.each([
    ["block", true],
    ["gradient", false],
  ])(
    "keeps the %s carousel height and controls fixed across slides",
    (_, isBlock) => {
      // Arrange
      const section = renderCarousel(isBlock)
      const next = screen.getByRole("button", { name: "Next slide" })
      const heightBefore = section.getBoundingClientRect().height
      const controlsTopBefore = next.getBoundingClientRect().top

      // Act
      fireEvent.click(next)

      // Assert
      expect(section.getBoundingClientRect().height).toBe(heightBefore)
      expect(next.getBoundingClientRect().top).toBe(controlsTopBefore)
    },
  )
})

const indexedSlides = [
  { backgroundUrl: "/a.png", title: "Alpha" },
  { backgroundUrl: "/b.png", title: "Beta" },
  { backgroundUrl: "/c.png", title: "Gamma" },
]

const liveRegion = () => screen.getByText(/Slide \d of \d:/)

describe("HeroCarouselClient preview index", () => {
  it("changes its own slide on next when no preview provider is present", async () => {
    // Arrange
    render(
      <HeroCarouselClient
        isBlock={false}
        headingTag="h1"
        slides={indexedSlides}
      />,
    )

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Next slide" }))

    // Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")
  })

  it("follows the preview index and sends next through setActiveIndex", async () => {
    // Arrange
    const Harness = () => {
      const [activeIndex, setActiveIndex] = useState(1)

      return (
        <HeroCarouselPreviewProvider value={{ activeIndex, setActiveIndex }}>
          <HeroCarouselClient
            isBlock={false}
            headingTag="h1"
            slides={indexedSlides}
          />
        </HeroCarouselPreviewProvider>
      )
    }

    render(<Harness />)

    // Act / Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")

    await userEvent.click(screen.getByRole("button", { name: "Next slide" }))

    expect(liveRegion().textContent).toBe("Slide 3 of 3: Gamma")
  })
})
