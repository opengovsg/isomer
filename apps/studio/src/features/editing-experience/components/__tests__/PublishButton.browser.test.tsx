import type { ResourceAbility } from "~/server/modules/permissions/permissions.type"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { AbilityProvider } from "@casl/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildPermissionsForResource } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
import { RoleType } from "~prisma/generated/generatedEnums"

import PublishButton, { PUBLISH_BUTTON_HINT } from "../PublishButton"

// Mutable so individual tests can drive the enabled/disabled states.
const currPage = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}))

const PENDING_PAGE = { draftBlobId: "draft-1", scheduledAt: null }

// PublishButton is wrapped in withSuspense, whose Suspense wrapper waits for the
// Next.js router to be ready before mounting children. Provide a ready router.
vi.mock("next/router", () => ({
  useRouter: () => ({ isReady: true }),
}))

// useFireContentEditSurveyEvent pulls in ~/env.mjs, which reads process.env
// directly at module scope — harmless under jsdom but a ReferenceError under
// Browser Mode's real-browser runtime, where `process` doesn't exist. It's
// unrelated to the permission gate under test, so stub it out.
vi.mock("../../hooks/contentEditSurvey", () => ({
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
          useSuspenseQuery: () => [currPage.value],
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

beforeEach(() => {
  currPage.value = PENDING_PAGE
})

// TouchableTooltip opens on mouseenter of the span it wraps around the button.
const hoverPublishButton = async () => {
  const button = await screen.findByRole("button", { name: "Publish options" })
  fireEvent.mouseEnter(button.parentElement!)
}

describe("PublishButton permission gating", () => {
  it("renders the Publish button for publishers", () => {
    renderForRole(RoleType.Publisher)
    expect(
      screen.queryByRole("button", { name: "Publish options" }),
    ).not.toBeNull()
  })

  it("renders the Publish button for admins", () => {
    renderForRole(RoleType.Admin)
    expect(
      screen.queryByRole("button", { name: "Publish options" }),
    ).not.toBeNull()
  })

  // Regression: @casl/react v7 changed the render-prop to receive a single
  // `{ isAllowed }` object instead of a positional boolean. Destructuring it as a
  // positional boolean made `allowed` an always-truthy object, leaking the button
  // to editors regardless of their permissions.
  it("renders the Publish button disabled for editors", () => {
    renderForRole(RoleType.Editor)
    const button = screen.queryByRole("button", { name: "Publish options" })
    expect(button).not.toBeNull()
    expect(button).toBeDisabled()
  })
})

describe("PublishButton tooltip", () => {
  it("shows the publish hint when the button is enabled", async () => {
    renderForRole(RoleType.Publisher)
    await hoverPublishButton()
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      PUBLISH_BUTTON_HINT,
    )
  })

  it("shows the permission reason instead of the hint for editors", async () => {
    renderForRole(RoleType.Editor)
    await hoverPublishButton()
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent(
      "You need to be a Publisher or Admin to publish.",
    )
    expect(tooltip).not.toHaveTextContent(PUBLISH_BUTTON_HINT)
  })

  it("shows the disabled reason instead of the hint when nothing is pending", async () => {
    currPage.value = { draftBlobId: null, scheduledAt: null }
    renderForRole(RoleType.Publisher)
    await hoverPublishButton()
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("All changes have been published")
    expect(tooltip).not.toHaveTextContent(PUBLISH_BUTTON_HINT)
  })
})
