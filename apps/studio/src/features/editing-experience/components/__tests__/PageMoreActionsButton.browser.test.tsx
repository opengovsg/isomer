import type { ReactNode } from "react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { PageMoreActionsButton } from "../PageMoreActionsButton"

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  isAllowed: true,
  isUnpublishEnabled: true,
  type: "Page",
}))

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/sites/[siteId]/pages/[pageId]",
    isReady: true,
    push: mocks.push,
  }),
}))

vi.mock("~/features/permissions", () => ({
  Can: ({
    children,
  }: {
    children: (props: { isAllowed: boolean }) => ReactNode
  }) => children({ isAllowed: mocks.isAllowed }),
}))

vi.mock("~/hooks/useIsUnpublishEnabled", () => ({
  useIsUnpublishEnabled: () => mocks.isUnpublishEnabled,
}))

vi.mock("../PublishingModal", () => ({ CancelScheduleModal: () => null }))
vi.mock("../PublishOrUnpublishModal", () => ({
  PublishOrUnpublishModal: () => null,
}))

vi.mock("~/utils/trpc", () => ({
  trpc: {
    page: {
      readPage: {
        useSuspenseQuery: () => [
          {
            type: mocks.type,
            publishedVersionId: 1,
            scheduledAt: null,
            scheduledAction: null,
            parentId: null,
            draftBlobId: null,
          },
        ],
      },
    },
    folder: {
      getIndexpage: {
        useQuery: () => ({ data: undefined, isLoading: false, isError: false }),
      },
    },
  },
}))

const openMenu = async () => {
  render(
    <ThemeProvider theme={theme}>
      <PageMoreActionsButton pageId={2} siteId={1} />
    </ThemeProvider>,
  )
  fireEvent.click(await screen.findByRole("button", { name: "More actions" }))
  await screen.findByRole("button", { name: "View page history" })
}

describe("PageMoreActionsButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isAllowed = true
    mocks.isUnpublishEnabled = true
    mocks.type = ResourceType.Page
  })

  it("offers history alongside unpublish and opens the existing editor panel", async () => {
    await openMenu()

    expect(screen.getByRole("button", { name: "Unpublish page" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "View page history" }))

    expect(mocks.push).toHaveBeenCalledWith(
      { pathname: "/sites/1/pages/2", query: { history: "true" } },
      undefined,
      { shallow: true },
    )
  })

  it("keeps history available without unpublish permission", async () => {
    mocks.isAllowed = false
    await openMenu()

    expect(
      screen
        .getByRole("button", { name: "Unpublish page" })
        .hasAttribute("disabled"),
    ).toBe(true)
    expect(
      screen
        .getByRole("button", { name: "View page history" })
        .hasAttribute("disabled"),
    ).toBe(false)
  })

  it("offers history for the root page even when unpublishing is unavailable", async () => {
    mocks.type = ResourceType.RootPage
    mocks.isUnpublishEnabled = false
    await openMenu()

    expect(screen.queryByRole("button", { name: "Unpublish page" })).toBeNull()
    expect(
      screen.getByRole("button", { name: "View page history" }),
    ).toBeTruthy()
  })
})
