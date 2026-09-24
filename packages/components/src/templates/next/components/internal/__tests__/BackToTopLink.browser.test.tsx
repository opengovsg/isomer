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

  it("renders a button rather than an anchor", () => {
    // Arrange
    render(<BackToTopLink />)

    // Assert
    // "Back to top" is an action, so it must be a <button>. Using a <button>
    // (instead of an <a href="#">) is what avoids the Studio preview iframe
    // navigating the whole Studio app into itself ("studioception").
    const button = screen.getByRole("button", { name: /back to top/i })
    expect(button.tagName).toBe("BUTTON")
    expect(screen.queryByRole("link", { name: /back to top/i })).toBeNull()
  })

  it("scrolls to the top on click", () => {
    // Arrange
    render(<BackToTopLink />)
    const button = screen.getByRole("button", { name: /back to top/i })

    // Act
    fireEvent.click(button)

    // Assert
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 })
  })
})
