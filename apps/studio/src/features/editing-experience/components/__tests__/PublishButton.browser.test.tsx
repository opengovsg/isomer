import type { ResourceAbility } from "~/server/modules/permissions/permissions.type"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { AbilityProvider } from "@casl/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { buildPermissionsForResource } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
import { RoleType } from "~prisma/generated/generatedEnums"

import PublishButton from "../PublishButton"

// The "Schedule for later" dropdown relies on Chakra's Menu context, which does
// not initialise under jsdom. It is unrelated to the permission gate under test,
// so stub the menu primitives to plain passthroughs.
vi.mock("@chakra-ui/react", async (importActual) => {
  const actual = (await importActual()) as Record<string, unknown>
  return {
    ...actual,
    Menu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    MenuButton: ({ "aria-label": ariaLabel }: { "aria-label"?: string }) => (
      <button aria-label={ariaLabel} />
    ),
    MenuList: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    MenuItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// PublishButton is wrapped in withSuspense, whose Suspense wrapper waits for the
// Next.js router to be ready before mounting children. Provide a ready router.
vi.mock("next/router", () => ({
  useRouter: () => ({ isReady: true }),
}))

// useFireContentEditSurveyEvent pulls in ~/env.mjs, which reads process.env
// directly at module scope — harmless under jsdom but a ReferenceError under
// Browser Mode's real-browser runtime, where `process` doesn't exist. It's
// unrelated to the permission gate under test, so stub it out.
vi.mock("../../hooks/useContentEditSurvey", () => ({
  useFireContentEditSurveyEvent: () => vi.fn(),
}))

// PublishButton reads the current page (to decide the enabled/pending state) and
// owns the publish mutation. Neither is what we are testing here — the regression
// is purely about whether the <Can> permission gate shows the button — so stub
// the tRPC surface with the minimum the component touches on render.
vi.mock("~/utils/trpc", () => {
  const noop = vi.fn()
  return {
    trpc: {
      page: {
        readPage: {
          useSuspenseQuery: () => [
            { draftBlobId: "draft-1", scheduledAt: null },
          ],
        },
        publishPage: {
          useMutation: () => ({ mutate: noop, isPending: false }),
        },
      },
      useUtils: () => ({
        page: {
          readPage: { refetch: noop },
        },
        site: { getLocalisedSitemap: { invalidate: noop } },
      }),
    },
  }
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
  it("does NOT render the Publish button for editors", () => {
    renderForRole(RoleType.Editor)
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull()
  })
})
