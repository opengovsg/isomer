import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { pageHandlers } from "tests/msw/handlers/page"
import { redirectHandlers } from "tests/msw/handlers/redirect"
import { sitesHandlers } from "tests/msw/handlers/sites"
import RedirectsSettingsPage from "~/pages/sites/[siteId]/settings/redirects"
import { ADMIN_HANDLERS } from "~/stories/handlers"
import { createRedirectionsEnabledGbParameters } from "~/stories/utils/growthbook"

const COMMON_HANDLERS = [
  ...ADMIN_HANDLERS,
  sitesHandlers.getNotification.default(),
  sitesHandlers.getTheme.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.readPageAndBlob.homepage(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
]

const COMMON_NEXTJS = {
  router: {
    asPath: "/sites/1/settings/redirects",
    query: {
      siteId: "1",
    },
  },
}

const meta: Meta<typeof RedirectsSettingsPage> = {
  title: "Pages/Site Management/Agency Settings Page/Redirects",
  component: RedirectsSettingsPage,
  parameters: {
    getLayout: RedirectsSettingsPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: COMMON_NEXTJS,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        redirectHandlers.validate.noIssues(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const Empty: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
    msw: {
      handlers: [
        redirectHandlers.list.empty(),
        redirectHandlers.count.empty(),
        redirectHandlers.validate.noIssues(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

// Fills the add-redirect form with a valid (schema-passing) pair and submits,
// so the server's response drives the inline error states below.
const submitNewRedirect = async (canvasElement: HTMLElement) => {
  const screen = within(canvasElement.ownerDocument.body)
  const sourceInput = await screen.findByPlaceholderText("redirect-from")
  await userEvent.type(sourceInput, "old-page")
  await userEvent.type(
    screen.getByPlaceholderText("/path-to-page or https://www.google.com"),
    "/new-page",
  )
  const addButton = screen.getByRole("button", { name: "Add" })
  await waitFor(() => expect(addButton).toBeEnabled())
  await userEvent.click(addButton, { pointerEventsCheck: 0 })
  return screen
}

// Creating over an existing live redirect shows the error inline on the source.
export const AlreadyExistsError: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        redirectHandlers.create.alreadyExists(),
        redirectHandlers.validate.noIssues(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = await submitNewRedirect(canvasElement)
    await expect(
      await screen.findByText("This page is already being redirected."),
    ).toBeVisible()
  },
}

// A redirect that loops back shows the error inline on the destination.
export const RedirectLoopError: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        redirectHandlers.create.loop(),
        redirectHandlers.validate.noIssues(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = await submitNewRedirect(canvasElement)
    await expect(
      await screen.findByText(
        "This will trap visitors in a never-ending loop.",
      ),
    ).toBeVisible()
    // The loop error is inline only — the generic failure toast must not also
    // fire (regression guard for the error switch falling through to default).
    await expect(screen.queryByText("Failed to add redirect")).toBeNull()
  },
}

// Typing a destination that doesn't resolve to a page and blurring the field
// surfaces a (non-blocking) warning beneath the row.
export const DestinationNotFoundWarning: Story = {
  parameters: {
    growthbook: [createRedirectionsEnabledGbParameters(true)],
    msw: {
      handlers: [
        redirectHandlers.list.default(),
        redirectHandlers.count.default(),
        redirectHandlers.validate.destinationNotFound(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.type(
      await screen.findByPlaceholderText("redirect-from"),
      "old-page",
    )
    await userEvent.type(
      screen.getByPlaceholderText("/path-to-page or https://www.google.com"),
      "/no-page",
    )
    // Blur the destination to trigger the on-blur validate call.
    await userEvent.tab()
    await expect(
      await screen.findByText(
        "This page doesn't exist on your site yet. Make sure the page is live before publishing this redirect.",
      ),
    ).toBeVisible()
  },
}
