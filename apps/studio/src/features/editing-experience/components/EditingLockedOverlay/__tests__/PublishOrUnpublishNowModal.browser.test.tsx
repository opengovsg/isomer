import type { UseDisclosureReturn } from "@chakra-ui/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen } from "@testing-library/react"
import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"

import { PublishOrUnpublishNowModal } from "../PublishOrUnpublishNowModal"

// Mutable so each test can drive the redirect-count query's state. Both the
// modal (for its confirm gate) and the warning read the same hook, which is
// backed by this one query.
const redirectQuery = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}))

// posthog.capture only fires on a successful mutation; the gate tests never
// confirm, so stub it to keep the module import inert in Browser Mode.
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }))

// The modal owns two publish mutations and reads the redirect count through
// countByDestinationResource. None of the mutation machinery runs on render —
// the gate is all we test — so stub the tRPC surface to the minimum the
// component touches.
vi.mock("~/utils/trpc", () => {
  const noop = vi.fn()
  return {
    trpc: {
      redirect: {
        countByDestinationResource: {
          useQuery: () => redirectQuery.value,
        },
      },
      page: {
        publishPage: {
          useMutation: () => ({ mutate: noop, isPending: false }),
        },
        unpublishPage: {
          // mutate fires onSuccess so the analytics capture under test runs.
          useMutation: (opts?: { onSuccess?: () => void }) => ({
            mutate: () => opts?.onSuccess?.(),
            isPending: false,
          }),
        },
      },
      useUtils: () => ({
        page: { readPage: { refetch: noop } },
        site: { getLocalisedSitemap: { invalidate: noop } },
        resource: { listWithoutRoot: { invalidate: noop } },
        collection: { list: { invalidate: noop } },
        folder: { getIndexpage: { invalidate: noop } },
      }),
    },
  }
})

// The component spreads a full UseDisclosureReturn into Chakra's <Modal>; only
// isOpen matters here. onClose is consumed by its own named prop.
const openDisclosure = {
  isOpen: true,
  onOpen: vi.fn(),
  onClose: vi.fn(),
  onToggle: vi.fn(),
  isControlled: false,
  getButtonProps: vi.fn(() => ({})),
  getDisclosureProps: vi.fn(() => ({})),
} as unknown as UseDisclosureReturn

const renderModal = (action: "publish" | "unpublish") =>
  render(
    <ThemeProvider theme={theme}>
      <PublishOrUnpublishNowModal
        action={action}
        pageId={1}
        siteId={1}
        {...openDisclosure}
      />
    </ThemeProvider>,
  )

beforeEach(() => {
  redirectQuery.value = { data: 0, isPending: false, isError: false }
  vi.mocked(posthog.capture).mockClear()
})

describe("PublishOrUnpublishNowModal redirect-check gating", () => {
  // Regression: the confirm gate must read isPending, not isLoading. A first
  // fetch that mounts offline is pending but paused (not fetching), so isLoading
  // is false while the warning still shows "Checking…". Gating on isLoading let
  // the user unpublish before the redirect check resolved.
  it("keeps unpublish disabled while the redirect check is pending (incl. an offline-paused fetch)", () => {
    redirectQuery.value = {
      data: undefined,
      isPending: true,
      isLoading: false, // paused, not fetching — the offline case
      isError: false,
    }
    renderModal("unpublish")
    expect(
      screen.getByRole("button", { name: "Yes, unpublish now" }),
    ).toBeDisabled()
  })

  it("enables unpublish once the redirect check resolves", () => {
    redirectQuery.value = {
      data: 2,
      isPending: false,
      isLoading: false,
      isError: false,
    }
    renderModal("unpublish")
    expect(
      screen.getByRole("button", { name: "Yes, unpublish now" }),
    ).toBeEnabled()
  })

  // The gate is scoped to unpublish: publish's redirect query is disabled, so it
  // reports isPending forever — gating on bare isPending would freeze publish.
  it("keeps publish enabled even though its disabled redirect query reports pending", () => {
    redirectQuery.value = {
      data: undefined,
      isPending: true,
      isLoading: false,
      isError: false,
    }
    renderModal("publish")
    expect(
      screen.getByRole("button", { name: "Yes, publish now" }),
    ).toBeEnabled()
  })
})

describe("PublishOrUnpublishNowModal redirect-count analytics", () => {
  // React Query keeps the last successful data after a failed refetch, so on an
  // errored check the modal must tag the count unknown (null), not send the
  // stale value as if it were current.
  it("tags redirect_count null on the success event when the check errored", () => {
    redirectQuery.value = { data: 3, isPending: false, isError: true }
    renderModal("unpublish")
    fireEvent.click(screen.getByRole("button", { name: "Yes, unpublish now" }))
    expect(posthog.capture).toHaveBeenCalledWith(
      "page_unpublished",
      expect.objectContaining({
        redirect_count: null,
        source: "scheduled_override",
      }),
    )
  })
})
