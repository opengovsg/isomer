import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { BackToTopLink } from "../BackToTopLink"

describe("BackToTopLink", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("scrolls to the top and prevents the default anchor navigation on click", () => {
    // Arrange
    render(<BackToTopLink />)
    const link = screen.getByRole("link", { name: /back to top/i })

    // Act
    // fireEvent.click returns false when the click was cancelled via
    // event.preventDefault(). Suppressing the browser's default href="#"
    // navigation is what prevents the Studio preview iframe from loading the
    // whole Studio app into itself ("studioception").
    const notCancelled = fireEvent.click(link)

    // Assert
    expect(notCancelled).toBe(false)
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 })
  })
})
