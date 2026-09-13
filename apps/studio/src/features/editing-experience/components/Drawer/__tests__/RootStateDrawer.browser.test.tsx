import type { IsomerSchema } from "@opengovsg/isomer-components"
import { ThemeProvider } from "@opengovsg/design-system-react"
import type * as DesignSystemReact from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
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
          return { mutate: noop, isPending: false }
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

  it("shows an error toast when saving the index-page conversion fails", () => {
    // Arrange
    capturedUpdateBlobOptions.length = 0
    renderDrawer({
      pageState: CONTENT_PAGE,
      permalink: "about-us",
      title: "About us",
    })
    const savePageOptions = capturedUpdateBlobOptions.find(
      (options): options is { onError: (error: Error) => void } =>
        !!options &&
        typeof (options as { onError?: unknown }).onError === "function",
    )

    // Act
    expect(savePageOptions).toBeDefined()
    savePageOptions?.onError(new Error("network down"))

    // Assert — without an onError handler the failure is silent
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" }),
    )
  })
})
