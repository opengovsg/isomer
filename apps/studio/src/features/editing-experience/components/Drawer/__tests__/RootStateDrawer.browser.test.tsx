import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import * as nextRouter from "next/router"
import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import * as isomerAdminHook from "~/hooks/useIsUserIsomerAdmin"
import * as collectionTagsHook from "~/hooks/useNewCollectionTagsManagement"
import { theme } from "~/theme"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

import RootStateDrawer from "../RootStateDrawer"

const noop = vi.fn()

beforeEach(() => {
  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(nextRouter, "useRouter").mockReturnValue({
    query: { pageId: "1", siteId: "1" },
  } as ReturnType<typeof nextRouter.useRouter>)

  vi.spyOn(posthog, "capture").mockImplementation(noop)

  vi.spyOn(isomerAdminHook, "useIsUserIsomerAdmin").mockReturnValue({
    isAdmin: false,
    isLoading: false,
  })

  vi.spyOn(collectionTagsHook, "useNewCollectionTagsManagement").mockReturnValue(
    false,
  )

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc.page.readPage, "useSuspenseQuery").mockReturnValue([
    { scheduledAt: null },
  ] as ReturnType<typeof trpc.page.readPage.useSuspenseQuery>)

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc.page.reorderBlock, "useMutation").mockReturnValue({
    mutate: noop,
  } as ReturnType<typeof trpc.page.reorderBlock.useMutation>)

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc.page.updatePageBlob, "useMutation").mockReturnValue({
    mutate: noop,
    isPending: false,
  } as ReturnType<typeof trpc.page.updatePageBlob.useMutation>)

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc, "useUtils").mockReturnValue({
    page: {
      readPage: { invalidate: noop },
      readPageAndBlob: { invalidate: noop },
    },
    collection: {
      countTagOptionsUsage: { invalidate: noop },
    },
  } as ReturnType<typeof trpc.useUtils>)
})

const SEARCH_PAGE: IsomerSchema = {
  page: { title: "Search", description: "Search results" },
  layout: "search",
  content: [],
  version: "0.1.0",
}

const CONTENT_PAGE: IsomerSchema = {
  page: { title: "About us", description: "About us" },
  layout: "content",
  content: [],
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
