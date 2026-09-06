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
  // @ts-expect-error partial NextRouter mock for unit test
  vi.spyOn(nextRouter, "useRouter").mockReturnValue({
    query: { pageId: "1", siteId: "1" },
  })

  vi.spyOn(posthog, "capture").mockImplementation(noop)

  vi.spyOn(isomerAdminHook, "useIsUserIsomerAdmin").mockReturnValue({
    isAdmin: false,
    isLoading: false,
  })

  vi.spyOn(
    collectionTagsHook,
    "useNewCollectionTagsManagement",
  ).mockReturnValue(false)

  // @ts-expect-error partial tRPC suspense query mock for unit test
  vi.spyOn(trpc.page.readPage, "useSuspenseQuery").mockReturnValue([
    { scheduledAt: null },
  ])

  // @ts-expect-error partial tRPC mutation mock for unit test
  vi.spyOn(trpc.page.reorderBlock, "useMutation").mockReturnValue({
    mutate: noop,
  })

  // @ts-expect-error partial tRPC mutation mock for unit test
  vi.spyOn(trpc.page.updatePageBlob, "useMutation").mockReturnValue({
    mutate: noop,
    isPending: false,
  })

  vi.spyOn(trpc, "useUtils").mockReturnValue(
    // SAFETY: partial tRPC utils mock for unit test.
    // @ts-expect-error partial tRPC utils mock for unit test
    {
      page: {
        readPage: { invalidate: noop },
        readPageAndBlob: { invalidate: noop },
      },
      collection: {
        countTagOptionsUsage: { invalidate: noop },
      },
    } as ReturnType<typeof trpc.useUtils>,
  )
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
