import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
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
  },
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
    })
    renderDrawer()

    // Act
    screen.getByRole("button", { name: "Load more" }).click()

    // Assert
    expect(fetchNextPage).toHaveBeenCalledOnce()
  })
})
