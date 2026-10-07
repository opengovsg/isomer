import { ThemeProvider } from "@opengovsg/design-system-react"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { useState } from "react"
import Frame from "react-frame-component"
import { afterEach, describe, expect, it } from "vitest"
import { theme } from "~/theme"

import { DiscardChangesModal } from "../DiscardChangesModal"

const SKIP_LABEL = "Skip to main content"

const Harness = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ThemeProvider theme={theme}>
      <Frame title="preview">
        <a href="#content">{SKIP_LABEL}</a>
        <button type="button" onClick={() => setIsOpen(true)}>
          Edit
        </button>
        <div id="content">Main</div>
      </Frame>
      <DiscardChangesModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onDiscard={() => setIsOpen(false)}
        returnFocusOnClose={false}
        blockScrollOnMount={false}
        lockFocusAcrossFrames={false}
      />
    </ThemeProvider>
  )
}

describe("DiscardChangesModal preview iframe focus", () => {
  afterEach(() => {
    cleanup()
  })

  it("does not focus Skip to main content when the dialog closes", async () => {
    // Arrange
    render(<Harness />)
    const iframe = await screen.findByTitle("preview")
    const iframeDocument = (iframe as HTMLIFrameElement).contentDocument
    expect(iframeDocument).not.toBeNull()

    const editButton = await waitFor(() => {
      const button = iframeDocument!.querySelector("button")
      expect(button).not.toBeNull()
      return button!
    })

    // Act
    fireEvent.click(editButton)
    fireEvent.click(
      await screen.findByRole("button", { name: "Go back to editing" }),
    )

    // Assert
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", {
          name: /Are you sure you want to discard your changes/i,
        }),
      ).not.toBeInTheDocument()
    })
    expect(iframeDocument!.activeElement?.textContent).not.toBe(SKIP_LABEL)
  })
})
