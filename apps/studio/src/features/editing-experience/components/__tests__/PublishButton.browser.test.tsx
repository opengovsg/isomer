import type { ReactNode } from "react"
import type { ResourceAbility } from "~/server/modules/permissions/permissions.type"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { AbilityProvider } from "@casl/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import * as nextRouter from "next/router"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import * as contentEditSurvey from "~/features/editing-experience/hooks/useContentEditSurvey"
import { buildPermissionsForResource } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
import { trpc } from "~/utils/trpc"
import { RoleType } from "~prisma/generated/generatedEnums"

import PublishButton from "../PublishButton"

const noop = vi.fn()

interface ChakraMenuModule {
  Menu: (props: { children?: ReactNode }) => ReactNode
  MenuButton: (props: {
    children?: ReactNode
    "aria-label"?: string
  }) => ReactNode
  MenuList: (props: { children?: ReactNode }) => ReactNode
  MenuItem: (props: { children?: ReactNode }) => ReactNode
}

beforeAll(async () => {
  // SAFETY: importActual returns the real Chakra module; cast to the menu subset under test
  const chakra = (await vi.importActual(
    "@chakra-ui/react",
  )) as ChakraMenuModule
  vi.spyOn(chakra, "Menu").mockImplementation(({ children }) => children)
  vi.spyOn(chakra, "MenuButton").mockImplementation(
    ({ "aria-label": ariaLabel }) => (
      <button type="button" aria-label={ariaLabel} />
    ),
  )
  vi.spyOn(chakra, "MenuList").mockImplementation(({ children }) => children)
  vi.spyOn(chakra, "MenuItem").mockImplementation(({ children }) => children)
})

beforeEach(() => {
  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(nextRouter, "useRouter").mockReturnValue({
    isReady: true,
  } as ReturnType<typeof nextRouter.useRouter>)

  vi.spyOn(contentEditSurvey, "useFireContentEditSurveyEvent").mockReturnValue(
    vi.fn(),
  )

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc.page.readPage, "useSuspenseQuery").mockReturnValue([
    { draftBlobId: "draft-1", scheduledAt: null },
  ] as ReturnType<typeof trpc.page.readPage.useSuspenseQuery>)

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc.page.publishPage, "useMutation").mockReturnValue({
    mutate: noop,
    isPending: false,
  } as ReturnType<typeof trpc.page.publishPage.useMutation>)

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc, "useUtils").mockReturnValue({
    page: {
      readPage: { refetch: noop },
    },
    site: { getLocalisedSitemap: { invalidate: noop } },
  } as ReturnType<typeof trpc.useUtils>)
})

// Build the client ability exactly the way PermissionsProvider does, so this test
// exercises the real CASL rules + the real <Can> render-prop contract.
const abilityFor = (role: RoleType) => {
  const builder = new AbilityBuilder<ResourceAbility>(createMongoAbility)
  buildPermissionsForResource(role, builder)
  return builder.build({ detectSubjectType: () => "Resource" })
}

const renderForRole = (role: RoleType) =>
  render(
    <ThemeProvider theme={theme}>
      <AbilityProvider value={abilityFor(role)}>
        <PublishButton pageId={1} siteId={1} />
      </AbilityProvider>
    </ThemeProvider>,
  )

describe("PublishButton permission gating", () => {
  it("renders the Publish button for publishers", () => {
    renderForRole(RoleType.Publisher)
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeNull()
  })

  it("renders the Publish button for admins", () => {
    renderForRole(RoleType.Admin)
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeNull()
  })

  // Regression: @casl/react v7 changed the render-prop to receive a single
  // `{ isAllowed }` object instead of a positional boolean. Destructuring it as a
  // positional boolean made `allowed` an always-truthy object, leaking the button
  // to editors regardless of their permissions.
  it("renders the Publish button disabled for editors", () => {
    renderForRole(RoleType.Editor)
    const button = screen.queryByRole("button", { name: "Publish" })
    expect(button).not.toBeNull()
    expect(button).toBeDisabled()
  })
})
