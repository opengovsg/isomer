import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import type * as DesignSystemReact from "@opengovsg/design-system-react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import RootStateDrawer from "../RootStateDrawer"

const noop = vi.hoisted(() => vi.fn())
const toastMock = vi.hoisted(() => vi.fn())
const capturedUpdateBlobOptions = vi.hoisted(() => [] as unknown[])

vi.mock("@opengovsg/design-system-react", async (importOriginal) => {
  const actual = await importOriginal<typeof DesignSystemReact>()
  return { ...actual, useToast: () => toastMock }
})

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
        useMutation: (options: unknown) => {
          capturedUpdateBlobOptions.push(options)
          return {
            // Simulate a failed save: real tRPC would route the failure
            // to the mutation-level onError handler.
            mutate: () => {
              const onError = (options as { onError?: (e: Error) => void })
                ?.onError
              onError?.(new Error("network down"))
            },
            isPending: false,
          }
        },
      },
    },
    useUtils: () => ({
      page: {
        readPage: { invalidate: noop },
        readPageAndBlob: { invalidate: noop },
      },
      collection: {
        countTagOptionsUsage: { invalidate: noop },
      },
    }),
  },
}))

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
  type = ResourceType.Page,
}: {
  pageState: IsomerSchema
  permalink: string
  title: string
  type?: ResourceType
}) =>
  render(
    <ThemeProvider theme={theme}>
      <EditorDrawerProvider
        initialPageState={pageState}
        type={type}
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

  it("shows an error toast when saving the index-page conversion fails", () => {
    // Arrange — an IndexPage with a custom layout shows the conversion
    // infobox; drive the real preview → accept → save path.
    renderDrawer({
      pageState: CONTENT_PAGE,
      permalink: "about-us",
      title: "About us",
      type: ResourceType.IndexPage,
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Preview what this looks like" }),
    )
    fireEvent.click(
      screen.getByRole("button", { name: "Accept this change" }),
    )

    // Act — confirming runs handleSaveConversionToIndexPage; the mocked
    // save fails and must surface an error toast instead of failing silent.
    fireEvent.click(screen.getByRole("button", { name: "Accept changes" }))

    // Assert
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" }),
    )
  })
})
