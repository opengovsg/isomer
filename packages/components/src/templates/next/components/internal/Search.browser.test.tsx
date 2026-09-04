import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SearchField } from "./Search"

describe(SearchField, () => {
  it("uses only the field group focus indicator", () => {
    const { getByRole } = render(<SearchField aria-label="Search" />)
    const input = getByRole("searchbox")
    const fieldGroup = input.parentElement

    expect(fieldGroup).not.toBeNull()
    if (!fieldGroup) {
      throw new Error("Expected the search input to have a field group")
    }

    const unfocusedBoxShadow = getComputedStyle(fieldGroup).boxShadow

    fireEvent.focus(input)

    expect(["transparent", "rgba(0, 0, 0, 0)"]).toContain(
      getComputedStyle(input).outlineColor,
    )
    expect(fieldGroup.className).toContain("shadow-utility-feedback-info")
    expect(getComputedStyle(fieldGroup).boxShadow).not.toBe(unfocusedBoxShadow)
  })
})
