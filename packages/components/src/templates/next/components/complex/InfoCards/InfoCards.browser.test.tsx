import { act, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { INFOCARDS_CAROUSEL_MAX_CARDS, INFOCARDS_DISPLAY } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { SLIDE_DATA_ATTRIBUTE } from "./CarouselWrapperClient"
import { InfoCards } from "./InfoCards"

const cards = Array.from(
  { length: INFOCARDS_CAROUSEL_MAX_CARDS },
  (_, index) => ({
    title: `Card ${index + 1}`,
    description: "A short description.",
  }),
)

const renderCarousel = () => {
  const view = render(
    <div style={{ width: 1280 }}>
      <InfoCards
        type="infocards"
        site={generateSiteConfig()}
        layout="homepage"
        maxColumns="3"
        display={INFOCARDS_DISPLAY.carousel}
        variant="cardsWithoutImages"
        title="Section title"
        headingLevel={2}
        cards={cards}
      />
    </div>,
  )

  return view
}

const pageToEnd = (next: HTMLElement) => {
  for (let step = 0; step < 30 && !next.hasAttribute("disabled"); step++) {
    act(() => {
      next.focus()
      next.click()
    })
  }
}

describe("InfoCards carousel paging", () => {
  it("disables Next and hides earlier slides on the last page", async () => {
    // Arrange
    const { container } = renderCarousel()
    const next = await screen.findByRole("button", { name: "Next page" })

    // Act
    pageToEnd(next)

    // Assert
    const slides = [...container.querySelectorAll(`[${SLIDE_DATA_ATTRIBUTE}]`)]
    const firstInteractive = slides.findIndex(
      (slide) => !slide.hasAttribute("inert"),
    )
    expect(next.hasAttribute("disabled")).toBe(true)
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Previous page" }),
    )
    expect(container.querySelector("[data-fade-side='left']")).toBeTruthy()
    expect(firstInteractive).toBeGreaterThan(0)
    expect(
      slides
        .slice(firstInteractive)
        .every((slide) => !slide.hasAttribute("inert")),
    ).toBe(true)
    expect(slides.some((slide) => slide.hasAttribute("inert"))).toBe(true)
    expect(screen.getByRole("status").textContent).toMatch(/^Page (\d+) of \1$/)
  })

  it("returns to the first page from a page dot", async () => {
    // Arrange
    const { container } = renderCarousel()
    pageToEnd(await screen.findByRole("button", { name: "Next page" }))

    // Act
    act(() => {
      screen.getByRole("button", { name: /^Go to page 1 of / }).click()
    })

    // Assert
    expect(
      screen
        .getByRole("button", { name: "Previous page" })
        .hasAttribute("disabled"),
    ).toBe(true)
    expect(screen.getByRole("status").textContent).toMatch(/^Page 1 of /)
    expect(container.querySelector("[data-fade-side='right']")).toBeTruthy()
  })
})
