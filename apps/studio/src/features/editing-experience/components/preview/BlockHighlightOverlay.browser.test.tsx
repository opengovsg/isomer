import type { ComponentProps } from "react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { theme } from "~/theme"

import { BlockHighlightOverlay } from "./BlockHighlightOverlay"

const renderOverlay = (
  props: Partial<ComponentProps<typeof BlockHighlightOverlay>> = {},
) =>
  render(
    <ThemeProvider theme={theme}>
      <BlockHighlightOverlay
        top={0}
        left={0}
        width={320}
        height={120}
        label="Info cards"
        {...props}
      />
    </ThemeProvider>,
  )

describe("BlockHighlightOverlay", () => {
  it("moves a block up when Up is clicked", async () => {
    // Arrange
    const onMoveUp = vi.fn()
    renderOverlay({
      onEditClick: vi.fn(),
      onMoveUp,
      onMoveDown: vi.fn(),
      canMoveUp: true,
      canMoveDown: true,
    })

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Move block up" }))

    // Assert
    expect(onMoveUp).toHaveBeenCalledOnce()
    expect(screen.getByText("Info cards")).toBeVisible()
  })

  it("moves a block down when Down is clicked", async () => {
    // Arrange
    const onMoveDown = vi.fn()
    renderOverlay({
      onEditClick: vi.fn(),
      onMoveUp: vi.fn(),
      onMoveDown,
      canMoveUp: true,
      canMoveDown: true,
    })

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "Move block down" }),
    )

    // Assert
    expect(onMoveDown).toHaveBeenCalledOnce()
  })

  it("disables Up when the block is already at the top", () => {
    // Arrange / Act
    renderOverlay({
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      canMoveUp: false,
      canMoveDown: true,
    })

    // Assert
    expect(screen.getByRole("button", { name: "Move block up" })).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Move block down" }),
    ).toBeEnabled()
  })

  it("disables Down when the block is already at the bottom", () => {
    // Arrange / Act
    renderOverlay({
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      canMoveUp: true,
      canMoveDown: false,
    })

    // Assert
    expect(screen.getByRole("button", { name: "Move block up" })).toBeEnabled()
    expect(
      screen.getByRole("button", { name: "Move block down" }),
    ).toBeDisabled()
  })

  it("leaves the tag without move buttons when moving is not offered", () => {
    // Arrange / Act
    renderOverlay({ onEditClick: vi.fn() })

    // Assert
    expect(screen.getByRole("button", { name: "Edit" })).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Move block up" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Move block down" }),
    ).not.toBeInTheDocument()
  })
})
