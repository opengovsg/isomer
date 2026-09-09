import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"

import { ComplexEditorNestedDrawer } from "../ComplexEditorNestedDrawer"

vi.mock("@jsonforms/react", () => ({
  JsonFormsDispatch: () => null,
}))

const renderDrawer = (props: { label: string; headerLabel?: string }) =>
  render(
    <ThemeProvider theme={theme}>
      <ComplexEditorNestedDrawer
        visible
        schema={{}}
        uischema={{ type: "VerticalLayout", elements: [] }}
        path=""
        setSelectedIndex={vi.fn()}
        selectedIndex={0}
        maxIndex={0}
        isRemoveItemDisabled
        handleRemoveItem={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  )

describe("ComplexEditorNestedDrawer", () => {
  it("shows Edit ${label} when headerLabel is omitted", () => {
    // Arrange / Act
    renderDrawer({ label: "Filters" })

    // Assert
    expect(screen.getByText("Edit Filters")).toBeVisible()
  })

  it("shows headerLabel instead of Edit ${label} when provided", () => {
    // Arrange / Act
    renderDrawer({ label: "Filters", headerLabel: "Manage date filter" })

    // Assert
    expect(screen.getByText("Manage date filter")).toBeVisible()
    expect(screen.queryByText("Edit Filters")).not.toBeInTheDocument()
  })

  it("shows a text-filter headerLabel", () => {
    // Arrange / Act
    renderDrawer({ label: "Filters", headerLabel: "Manage text filter" })

    // Assert
    expect(screen.getByText("Manage text filter")).toBeVisible()
    expect(screen.queryByText("Edit Filters")).not.toBeInTheDocument()
  })
})
