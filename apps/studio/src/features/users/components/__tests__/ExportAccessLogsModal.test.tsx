// @vitest-environment jsdom
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createStore, Provider } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentSingaporeMonth } from "~/schemas/audit"
import { theme } from "~/theme"

import { exportAccessLogsModalAtom } from "../../atoms"
import { ExportAccessLogsModal } from "../ExportAccessLogsModal"

const SITE_ID = 42

// The shared export hook fires a PostHog capture on success.
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }))

const mutate = vi.fn()
let capturedOptions:
  | { onSuccess?: (data: unknown, variables: unknown) => void }
  | undefined
vi.mock("~/utils/trpc", () => ({
  trpc: {
    audit: {
      createExportRequest: {
        useMutation: (options: typeof capturedOptions) => {
          capturedOptions = options
          return { mutate, isPending: false }
        },
      },
    },
  },
}))

const renderOpen = () => {
  const store = createStore()
  store.set(exportAccessLogsModalAtom, { siteId: SITE_ID, isOpen: true })
  const rendered = render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ExportAccessLogsModal />
      </ThemeProvider>
    </Provider>,
  )
  return { store, ...rendered }
}

describe("ExportAccessLogsModal", () => {
  beforeEach(() => {
    mutate.mockClear()
    capturedOptions = undefined
  })

  it("is not open in the default (closed) atom state", () => {
    // Arrange / Act
    const store = createStore()
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <ExportAccessLogsModal />
        </ThemeProvider>
      </Provider>,
    )

    // Assert
    expect(screen.queryByText("Export access history")).toBeNull()
  })

  it("renders with 'All sites I have Admin access to' selected by default", () => {
    // Arrange / Act
    renderOpen()

    // Assert
    expect(screen.getByText("Export access history")).not.toBeNull()
    const allSites = screen.getByRole("radio", {
      name: "All sites I have Admin access to",
    })
    const siteOnly = screen.getByRole("radio", { name: "This site only" })
    expect((allSites as HTMLInputElement).checked).toBe(true)
    expect((siteOnly as HTMLInputElement).checked).toBe(false)
  })

  it("submits an Access export for the current month with the default 'allSites' scope", async () => {
    // Arrange
    renderOpen()

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Export logs" }))

    // Assert
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate).toHaveBeenCalledWith({
      scope: "allSites",
      siteId: SITE_ID,
      month: getCurrentSingaporeMonth(),
      reportType: "Access",
    })
  })

  it("submits scope 'site' when 'This site only' is picked", async () => {
    // Arrange
    renderOpen()

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "This site only" }))
    fireEvent.click(screen.getByRole("button", { name: "Export logs" }))

    // Assert
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "site" }),
    )
  })

  it("closes and resets the modal atom on successful submission", async () => {
    // Arrange
    const { store } = renderOpen()

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Export logs" }))
    await waitFor(() => expect(capturedOptions?.onSuccess).toBeDefined())
    capturedOptions?.onSuccess?.(undefined, mutate.mock.lastCall?.[0])

    // Assert
    expect(store.get(exportAccessLogsModalAtom)).toEqual({
      siteId: 0,
      isOpen: false,
    })
  })

  it("closes and resets the modal atom when dismissed via the close button", () => {
    // Arrange
    const { store } = renderOpen()

    // Act
    fireEvent.click(screen.getByRole("button", { name: /close/i }))

    // Assert
    expect(store.get(exportAccessLogsModalAtom)).toEqual({
      siteId: 0,
      isOpen: false,
    })
  })
})
