import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"

import { UnpublishRedirectWarning } from "../UnpublishRedirectWarning"

// Mutable so each test can drive the query's data/loading/error states.
const queryResult = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}))

// The component only touches this one read; stub it so we can render each
// branch without a backend.
vi.mock("~/utils/trpc", () => ({
  trpc: {
    redirect: {
      countByDestinationResource: {
        useQuery: () => queryResult.value,
      },
    },
  },
}))

const renderWarning = (props?: {
  onPendingChange?: (isPending: boolean) => void
  onRedirectCountChange?: (count: number | undefined) => void
}) =>
  render(
    <ThemeProvider theme={theme}>
      <UnpublishRedirectWarning pageId={1} siteId={1} {...props} />
    </ThemeProvider>,
  )

beforeEach(() => {
  queryResult.value = { data: 0, isPending: false, isError: false }
})

describe("UnpublishRedirectWarning", () => {
  it("warns (plural) when multiple redirects point to the page", () => {
    queryResult.value = { data: 3, isPending: false, isError: false }
    renderWarning()
    expect(screen.queryByText(/3 redirects point to this page/)).not.toBeNull()
  })

  it("warns (singular) when exactly one redirect points to the page", () => {
    queryResult.value = { data: 1, isPending: false, isError: false }
    renderWarning()
    expect(screen.queryByText(/1 redirect points to this page/)).not.toBeNull()
  })

  it("renders no warning when no redirects point to the page", () => {
    queryResult.value = { data: 0, isPending: false, isError: false }
    renderWarning()
    expect(screen.queryByText(/redirect/i)).toBeNull()
    expect(screen.queryByText(/Checking for redirects/)).toBeNull()
  })

  it("shows a loading state while the check is pending", () => {
    queryResult.value = { data: undefined, isPending: true, isError: false }
    renderWarning()
    expect(screen.queryByText(/Checking for redirects/)).not.toBeNull()
  })

  it("falls back to a warning when the check fails", () => {
    queryResult.value = { data: undefined, isPending: false, isError: true }
    renderWarning()
    expect(
      screen.queryByText(/couldn't check whether redirects point to this page/),
    ).not.toBeNull()
  })

  it("reports its pending state so callers can block confirmation on it", () => {
    queryResult.value = { data: undefined, isPending: true, isError: false }
    const onPendingChange = vi.fn()
    renderWarning({ onPendingChange })
    expect(onPendingChange).toHaveBeenCalledWith(true)

    queryResult.value = { data: 0, isPending: false, isError: false }
    renderWarning({ onPendingChange })
    expect(onPendingChange).toHaveBeenCalledWith(false)
  })

  it("reports the resolved redirect count so callers can tag analytics", () => {
    queryResult.value = { data: 3, isPending: false, isError: false }
    const onRedirectCountChange = vi.fn()
    renderWarning({ onRedirectCountChange })
    expect(onRedirectCountChange).toHaveBeenCalledWith(3)
  })

  it("reports undefined when the check fails", () => {
    queryResult.value = { data: undefined, isPending: false, isError: true }
    const onRedirectCountChange = vi.fn()
    renderWarning({ onRedirectCountChange })
    expect(onRedirectCountChange).toHaveBeenCalledWith(undefined)
  })
})
