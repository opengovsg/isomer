import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import HistoryStateDrawer from "../HistoryStateDrawer"

vi.mock("next/router", () => ({
  useRouter: () => ({ query: { pageId: "1", siteId: "1" } }),
}))

const noop = vi.hoisted(() => vi.fn())
const mockUseInfiniteQuery = vi.hoisted(() => vi.fn())

vi.mock("~/utils/trpc", () => ({
  trpc: {
    audit: {
      listResourceUpdates: {
        useInfiniteQuery: (...args: unknown[]) =>
          // oxlint-disable-next-line @typescript-eslint/no-unsafe-return
          mockUseInfiniteQuery(...args),
      },
    },
    site: {
      getLocalisedSitemap: {
        useSuspenseQuery: () => [{ id: "root", children: [] }],
      },
      getConfig: {
        useSuspenseQuery: () => [{}],
      },
      getFooter: {
        useSuspenseQuery: () => [{ content: {} }],
      },
      getNavbar: {
        useSuspenseQuery: () => [{ content: {} }],
      },
    },
  },
}))

vi.mock("~/features/preview/hooks/useSiteThemeCssVars", () => ({
  useSiteThemeCssVars: () => ({}),
}))

// `PreviewWithCustomSitemap` pulls in `~/utils/generateAssetUrl`, which reads
// `~/env.mjs` at module-eval time. `env.mjs` accesses `process.env`, which
// isn't defined in Vitest's real-browser (Chromium) mode — unlike a real
// Next.js build, where these are statically inlined at compile time. Mocked
// here purely to avoid that test-environment gap, not because this test
// cares about asset URLs.
vi.mock("~/utils/generateAssetUrl", () => ({
  ASSETS_BASE_URL: "",
  generateAssetUrl: (url: string) => url,
}))

const EMPTY_PAGE: IsomerSchema = {
  page: { title: "About us", description: "About us" },
  layout: "content",
  content: [],
  version: "0.1.0",
}

const renderDrawer = () =>
  render(
    <ThemeProvider theme={theme}>
      <EditorDrawerProvider
        initialPageState={EMPTY_PAGE}
        type={ResourceType.Page}
        permalink="about-us"
        siteId={1}
        pageId={1}
        updatedAt={new Date()}
        title="About us"
      >
        <HistoryStateDrawer />
      </EditorDrawerProvider>
    </ThemeProvider>,
  )

describe("HistoryStateDrawer", () => {
  it("shows an empty state when there are no changes", () => {
    // Arrange
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: [], nextOffset: null }] },
      fetchNextPage: noop,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    })

    // Act
    renderDrawer()

    // Assert
    expect(screen.queryByText("No changes yet")).not.toBeNull()
  })

  it("renders one row per ResourceUpdate entry with a View changes button", () => {
    // Arrange
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                id: "1",
                createdAt: new Date("2026-01-01T00:00:00Z"),
                actor: {
                  id: "u1",
                  name: "Alice",
                  email: "alice@example.com",
                },
                beforeContent: EMPTY_PAGE,
                afterContent: EMPTY_PAGE,
              },
              {
                id: "2",
                createdAt: new Date("2026-01-02T00:00:00Z"),
                actor: { id: "u2", name: "Bob", email: "bob@example.com" },
                beforeContent: EMPTY_PAGE,
                afterContent: EMPTY_PAGE,
              },
            ],
            nextOffset: null,
          },
        ],
      },
      fetchNextPage: noop,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    })

    // Act
    renderDrawer()

    // Assert
    expect(
      screen.getAllByRole("button", { name: "View changes" }),
    ).toHaveLength(2)
    expect(screen.queryByText("Alice")).not.toBeNull()
    expect(screen.queryByText("Bob")).not.toBeNull()
  })

  it("calls fetchNextPage when Load more is clicked", () => {
    // Arrange
    const fetchNextPage = vi.fn()
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: [], nextOffset: 20 }] },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    })
    renderDrawer()

    // Act
    screen.getByRole("button", { name: "Load more" }).click()

    // Assert
    expect(fetchNextPage).toHaveBeenCalledOnce()
  })

  it("shows a loading state while the query is in flight", () => {
    // Arrange
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      fetchNextPage: noop,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: true,
      isError: false,
    })

    // Act
    renderDrawer()

    // Assert
    expect(screen.queryByText("Loading...")).not.toBeNull()
    expect(screen.queryByText("No changes yet")).toBeNull()
  })

  it("shows an error state when the query fails, not the empty state", () => {
    // Arrange
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      fetchNextPage: noop,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: true,
    })

    // Act
    renderDrawer()

    // Assert
    expect(
      screen.queryByText(
        "Something went wrong while loading page history. Please try again.",
      ),
    ).not.toBeNull()
    expect(screen.queryByText("No changes yet")).toBeNull()
  })

  it("opens the diff modal with the row's data when View changes is clicked", async () => {
    // Arrange
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                id: "1",
                createdAt: new Date("2026-01-01T00:00:00Z"),
                actor: { id: "u1", name: "Alice", email: "alice@example.com" },
                beforeContent: EMPTY_PAGE,
                afterContent: EMPTY_PAGE,
              },
            ],
            nextOffset: null,
          },
        ],
      },
      fetchNextPage: noop,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    })

    // Act
    renderDrawer()
    screen.getByRole("button", { name: "View changes" }).click()

    // Assert
    // Scoped to the dialog itself (not just "Alice" appearing anywhere —
    // that text is already rendered unconditionally in the row list, so an
    // unscoped assertion would pass even if the click handler did nothing).
    // The highlight-toggle checkbox only exists once `PageDiffModal` mounts.
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByRole("checkbox", { name: "Highlight changes" }),
    ).not.toBeNull()
  })
})
