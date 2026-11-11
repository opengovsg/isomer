import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  EditorDrawerProvider,
  useEditorDrawerContext,
} from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { UnsavedPageChangesGuard } from "../UnsavedPageChangesGuard"

const NEXT_URL = "/sites/1"

const routeChangeStartHandlers = vi.hoisted<((url: string) => void)[]>(() => [])
const pushMock = vi.hoisted(() => vi.fn())
vi.mock("next/router", () => ({
  useRouter: () => ({
    push: pushMock,
    events: {
      on: (_event: string, handler: (url: string) => void) => {
        routeChangeStartHandlers.push(handler)
      },
      off: (_event: string, handler: (url: string) => void) => {
        const index = routeChangeStartHandlers.indexOf(handler)
        if (index !== -1) {
          routeChangeStartHandlers.splice(index, 1)
        }
      },
      emit: vi.fn(),
    },
  }),
}))

const PAGE_STATE: IsomerSchema = {
  version: "0.1.0",
  layout: "content",
  page: { title: "About us", description: "About us" },
  content: [{ type: "prose", content: [] }],
}

let drawerContext: ReturnType<typeof useEditorDrawerContext>

const ContextHarness = () => {
  drawerContext = useEditorDrawerContext()
  return null
}

const renderGuard = () =>
  render(
    <ThemeProvider theme={theme}>
      <EditorDrawerProvider
        initialPageState={PAGE_STATE}
        type={ResourceType.Page}
        permalink="/about"
        siteId={1}
        pageId={1}
        updatedAt={new Date()}
        title="About us"
      >
        <ContextHarness />
        <UnsavedPageChangesGuard />
      </EditorDrawerProvider>
    </ThemeProvider>,
  )

// Mirrors Next's router: a throwing handler aborts the route change.
const navigate = () => {
  let isBlocked = false
  act(() => {
    try {
      // Copy since the guard unsubscribes itself mid-emit.
      ;[...routeChangeStartHandlers].forEach((handler) => handler(NEXT_URL))
    } catch {
      isBlocked = true
    }
  })
  return isBlocked
}

describe("UnsavedPageChangesGuard", () => {
  beforeEach(() => {
    routeChangeStartHandlers.length = 0
    pushMock.mockReset()
  })

  it("lets navigation through when there are no unsaved changes", () => {
    // Arrange
    renderGuard()

    // Act
    const isBlocked = navigate()

    // Assert
    expect(isBlocked).toBe(false)
    expect(
      screen.queryByText("Are you sure you want to discard your changes?"),
    ).not.toBeInTheDocument()
  })

  it("blocks navigation and navigates only after discard is confirmed", async () => {
    // Arrange
    renderGuard()
    act(() => {
      drawerContext.setPreviewPageState({
        ...PAGE_STATE,
        page: { ...PAGE_STATE.page, title: "Edited" },
      })
    })

    // Act
    const isBlocked = navigate()

    // Assert
    expect(isBlocked).toBe(true)
    expect(
      await screen.findByText("Are you sure you want to discard your changes?"),
    ).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()

    // Act
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, discard changes" }),
    )

    // Assert
    expect(pushMock).toHaveBeenCalledWith(NEXT_URL)
  })

  // A new block is written to both saved and preview state before it persists.
  it("blocks navigation while a newly added block is unsaved", async () => {
    // Arrange
    renderGuard()
    act(() => {
      drawerContext.setAddedBlockIndex(0)
    })

    // Act
    const isBlocked = navigate()

    // Assert
    expect(isBlocked).toBe(true)
    expect(
      await screen.findByText("Are you sure you want to discard your changes?"),
    ).toBeInTheDocument()
  })

  // e.g. View history stays on the editor, so state must reset on discard.
  it("reverts edits and closes the modal on discard", async () => {
    // Arrange
    renderGuard()
    act(() => {
      drawerContext.setDrawerState({ state: "complexEditor" })
      drawerContext.setAddedBlockIndex(0)
      drawerContext.setModifiedAssets([{ path: "#/src", src: "/old.png" }])
      drawerContext.setPreviewPageState({
        ...PAGE_STATE,
        page: { ...PAGE_STATE.page, title: "Edited" },
      })
    })
    navigate()
    await screen.findByText("Are you sure you want to discard your changes?")

    // Act
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, discard changes" }),
    )

    // Assert
    await waitFor(() =>
      expect(
        screen.queryByText("Are you sure you want to discard your changes?"),
      ).not.toBeInTheDocument(),
    )
    const discardedState = { ...PAGE_STATE, content: [] }
    expect(drawerContext.previewPageState).toEqual(discardedState)
    expect(drawerContext.savedPageState).toEqual(discardedState)
    expect(drawerContext.addedBlockIndex).toBeNull()
    expect(drawerContext.drawerState).toEqual({ state: "root" })
    expect(drawerContext.modifiedAssets).toEqual([])
  })
})
