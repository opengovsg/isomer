import type { ComponentProps } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TAG_CATEGORY_TYPE } from "~/types/constants"

import { Filter } from "../Filter"

const DATE_FILTER = {
  id: "event-date",
  label: "Event date",
  type: TAG_CATEGORY_TYPE.Date,
  items: [{ id: "upcoming", label: "Upcoming", count: 3 }],
}

const renderDateFilter = (
  overrides: Partial<ComponentProps<typeof Filter>> = {},
) => {
  const setAppliedFilters = vi.fn()
  render(
    <Filter
      filters={[DATE_FILTER]}
      appliedFilters={[]}
      setAppliedFilters={setAppliedFilters}
      handleFilterToggle={vi.fn()}
      handleClearFilter={vi.fn()}
      {...overrides}
    />,
  )
  return { setAppliedFilters }
}

const openMobileDrawer = () => {
  fireEvent.click(screen.getByRole("button", { name: /filter results/i }))
  return screen.findByRole("dialog")
}

describe("Filter", () => {
  it("exposes the date section as an expanded disclosure, not a label inside the button", async () => {
    // Arrange
    renderDateFilter()

    // Act
    const dialog = await openMobileDrawer()

    // Assert
    const sectionButton = within(dialog).getByRole("button", {
      name: "Event date",
      expanded: true,
    })
    expect(sectionButton.querySelector("label")).toBeNull()
    expect(sectionButton.getAttribute("aria-controls")).toBeTruthy()
  })

  it("applies staged date filters when the drawer form is submitted", async () => {
    // Arrange
    const { setAppliedFilters } = renderDateFilter()
    const dialog = await openMobileDrawer()
    fireEvent.change(within(dialog).getByLabelText("From"), {
      target: { value: "2026-04-05" },
    })
    const applyButton = within(dialog).getByRole("button", {
      name: "Apply filters",
    })
    const form = applyButton.closest("form")

    // Act
    expect(applyButton.getAttribute("type")).toBe("submit")
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    // Assert
    expect(setAppliedFilters).toHaveBeenCalledExactlyOnceWith([
      {
        id: "event-date",
        items: [],
        dateRange: { start: "2026-04-05" },
      },
    ])
  })

  it("does not close the drawer when Escape is pressed in a date field", async () => {
    // Arrange
    renderDateFilter()
    const dialog = await openMobileDrawer()
    const from = within(dialog).getByLabelText("From")

    // Act
    from.focus()
    fireEvent.keyDown(from, { key: "Escape" })

    // Assert
    screen.getByRole("dialog")
  })
})
