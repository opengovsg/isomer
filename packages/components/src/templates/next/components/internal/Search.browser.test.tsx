import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SearchField } from "./Search"

describe("SearchField", () => {
  it("uses only the field group focus indicator", () => {
    // Arrange
    const { getByRole } = render(<SearchField aria-label="Search" />)
    const input = getByRole("searchbox")
    const fieldGroup = input.parentElement

    expect(fieldGroup).not.toBeNull()
    if (!fieldGroup) {
      throw new Error("Expected the search input to have a field group")
    }

    const unfocusedBoxShadow = getComputedStyle(fieldGroup).boxShadow

    // Act
    fireEvent.focus(input)

    // Assert
    expect(["transparent", "rgba(0, 0, 0, 0)"]).toContain(
      getComputedStyle(input).outlineColor,
    )
    expect(fieldGroup.className).toContain("shadow-utility-feedback-info")
    expect(getComputedStyle(fieldGroup).boxShadow).not.toBe(unfocusedBoxShadow)
  })

  it("calls onChange with the typed value", () => {
    // Arrange
    const onChange = vi.fn()
    const { getByRole } = render(
      <SearchField aria-label="Search" value="" onChange={onChange} />,
    )

    // Act
    fireEvent.change(getByRole("searchbox"), { target: { value: "gazette" } })

    // Assert
    expect(onChange).toHaveBeenCalledWith("gazette")
  })

  it("clears the field and restores focus", () => {
    // Arrange
    const onChange = vi.fn()
    const { getByRole } = render(
      <SearchField aria-label="Search" value="gazette" onChange={onChange} />,
    )
    const input = getByRole("searchbox")

    // Act
    fireEvent.click(getByRole("button", { name: "Clear search field" }))

    // Assert
    expect(onChange).toHaveBeenCalledWith("")
    expect(document.activeElement).toBe(input)
  })
})
