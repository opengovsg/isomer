import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"

import { UnpublishRedirectWarning } from "../UnpublishRedirectWarning"

// Mutable so each test can drive the query's data/loading/error states.
const queryResult = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}))

// The redirect-warning funnel checkpoint captures via posthog on render; stub
// it so these tests don't reach the real client.
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }))

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

const renderWarning = () =>
  render(
    <ThemeProvider theme={theme}>
      <UnpublishRedirectWarning pageId={1} siteId={1} />
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
})
