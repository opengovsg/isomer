import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import RootStateDrawer from "../RootStateDrawer"

const noop = vi.hoisted(() => vi.fn())

vi.mock("next/router", () => ({
  useRouter: () => ({ query: { pageId: "1", siteId: "1" } }),
}))

vi.mock("posthog-js", () => ({ default: { capture: noop } }))

vi.mock("~/hooks/useIsUserIsomerAdmin", () => ({
  useIsUserIsomerAdmin: () => ({ isAdmin: false, isLoading: false }),
}))

vi.mock("~/hooks/useNewCollectionTagsManagement", () => ({
  useNewCollectionTagsManagement: () => false,
}))

vi.mock("~/utils/trpc", () => ({
  trpc: {
    page: {
      readPage: {
        useSuspenseQuery: () => [{ scheduledAt: null }],
      },
      reorderBlock: {
        useMutation: () => ({ mutate: noop }),
      },
      updatePageBlob: {
        useMutation: () => ({ isPending: false, mutate: noop }),
      },
    },
    useUtils: () => ({
      collection: {
        countTagOptionsUsage: { invalidate: noop },
      },
      page: {
        readPage: { invalidate: noop },
        readPageAndBlob: { invalidate: noop },
      },
    }),
  },
}))

const SEARCH_PAGE: IsomerSchema = {
  content: [],
  layout: "search",
  page: { description: "Search results", title: "Search" },
  version: "0.1.0",
}

const CONTENT_PAGE: IsomerSchema = {
  content: [],
  layout: "content",
  page: { description: "About us", title: "About us" },
  version: "0.1.0",
}

const renderDrawer = ({
  pageState,
  permalink,
  title,
}: {
  pageState: IsomerSchema
  permalink: string
  title: string
}) =>
  render(
    <ThemeProvider theme={theme}>
      <EditorDrawerProvider
        initialPageState={pageState}
        type={ResourceType.Page}
        permalink={permalink}
        siteId={1}
        pageId={1}
        updatedAt={new Date()}
        title={title}
      >
        <RootStateDrawer />
      </EditorDrawerProvider>
    </ThemeProvider>,
  )

describe("RootStateDrawer", () => {
  it("does not allow adding blocks on the system Search page", () => {
    // Arrange / Act
    renderDrawer({
      pageState: SEARCH_PAGE,
      permalink: "search",
      title: "Search",
    })

    // Assert
    expect(screen.queryByRole("button", { name: "Add block" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Add a new block" })).toBeNull()
    expect(screen.queryByText("Custom blocks")).toBeNull()
  })

  it("allows adding blocks on a regular content page", () => {
    // Arrange / Act
    renderDrawer({
      pageState: CONTENT_PAGE,
      permalink: "about-us",
      title: "About us",
    })

    // Assert
    expect(screen.queryByRole("button", { name: "Add block" })).not.toBeNull()
    expect(screen.queryByText("Custom blocks")).not.toBeNull()
  })
})
