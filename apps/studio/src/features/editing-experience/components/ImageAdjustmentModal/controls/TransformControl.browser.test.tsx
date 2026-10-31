import { ThemeProvider } from "@opengovsg/design-system-react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"

import { TransformControl } from "./TransformControl"

const renderControl = (
  props: Partial<Parameters<typeof TransformControl>[0]> = {},
) => {
  const onRotate = vi.fn()
  const onFlip = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <TransformControl
        flipH={false}
        flipV={false}
        onRotate={onRotate}
        onFlip={onFlip}
        {...props}
      />
    </ThemeProvider>,
  )
  return { onRotate, onFlip }
}

describe("TransformControl", () => {
  afterEach(() => cleanup())

  it("emits cw/ccw rotate intents and h/v flip intents", () => {
    const { onRotate, onFlip } = renderControl()

    fireEvent.click(screen.getByRole("button", { name: "Rotate right" }))
    expect(onRotate).toHaveBeenCalledWith("cw")

    fireEvent.click(screen.getByRole("button", { name: "Rotate left" }))
    expect(onRotate).toHaveBeenCalledWith("ccw")

    fireEvent.click(screen.getByRole("button", { name: "Flip horizontal" }))
    expect(onFlip).toHaveBeenCalledWith("h")

    fireEvent.click(screen.getByRole("button", { name: "Flip vertical" }))
    expect(onFlip).toHaveBeenCalledWith("v")
  })

  it("disables only the rotate buttons when rotateDisabled (e.g. locked ratio before image load)", () => {
    const { onRotate, onFlip } = renderControl({ rotateDisabled: true })

    const rotateRight = screen.getByRole("button", { name: "Rotate right" })
    const rotateLeft = screen.getByRole("button", { name: "Rotate left" })
    expect(rotateRight).toBeDisabled()
    expect(rotateLeft).toBeDisabled()

    // Rotation can't fire while disabled...
    fireEvent.click(rotateRight)
    expect(onRotate).not.toHaveBeenCalled()

    // ...but flips (which don't need the image aspect) stay available.
    const flipH = screen.getByRole("button", { name: "Flip horizontal" })
    expect(flipH).not.toBeDisabled()
    fireEvent.click(flipH)
    expect(onFlip).toHaveBeenCalledWith("h")
  })

  it("marks a flip button pressed when its axis is active", () => {
    renderControl({ flipH: true })
    expect(
      screen.getByRole("button", { name: "Flip horizontal" }),
    ).toHaveAttribute("aria-pressed", "true")
    expect(
      screen.getByRole("button", { name: "Flip vertical" }),
    ).toHaveAttribute("aria-pressed", "false")
  })
})
