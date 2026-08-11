import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SearchField } from "./Search"

describe("SearchField", () => {
  it("uses only the field group focus indicator", () => {
    const { getByRole } = render(<SearchField aria-label="Search" />)
    const input = getByRole("searchbox")

    fireEvent.focus(input)

    expect(getComputedStyle(input).outlineColor).toBe("rgba(0, 0, 0, 0)")
    expect(getComputedStyle(input.parentElement!).boxShadow).not.toBe("none")
  })
})
