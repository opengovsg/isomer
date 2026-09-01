import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { auditHandlers } from "tests/msw/handlers/audit"
import { pageHandlers } from "tests/msw/handlers/page"
import { sitesHandlers } from "tests/msw/handlers/sites"
import AuditLogSettingsPage from "~/pages/sites/[siteId]/settings/audit-log"
import { ADMIN_HANDLERS } from "~/stories/handlers"
import { createAuditLogEnabledGbParameters } from "~/stories/utils/growthbook"

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
  auditHandlers.getExportWindow.default(),
]

const COMMON_NEXTJS = {
  router: {
    asPath: "/sites/1/settings/audit-log",
    query: {
      siteId: "1",
    },
  },
}

const meta: Meta<typeof AuditLogSettingsPage> = {
  title: "Pages/Site Management/Agency Settings Page/Audit Log",
  component: AuditLogSettingsPage,
  parameters: {
    getLayout: AuditLogSettingsPage.getLayout,
    // The page (and its sidenav entry) only exists behind this flag.
    growthbook: [createAuditLogEnabledGbParameters(true)],
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        auditHandlers.createExportRequest.success(),
      ],
    },
    nextjs: COMMON_NEXTJS,
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Admin, initial state: the current (partial) month is preselected, so the
// submit is immediately the enabled "Export logs" call-to-action.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await waitFor(async () =>
      expect(
        await screen.findByRole("button", { name: "Export logs" }),
      ).toBeEnabled(),
    )
    await expect(
      screen.getByRole("link", { name: "User management" }),
    ).toBeVisible()
  },
}

// Submitting shows the success toast: generation is async and the download
// link arrives by email.
export const ExportRequested: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await screen.findByRole("button", { name: "Export logs" }),
      { pointerEventsCheck: 0 },
    )
    // Presence, not a one-shot toBeVisible. BRIEF_TOAST_SETTINGS gives the
    // toast a 3s duration and it is removed ~200ms after that, so on a loaded
    // CI machine it can begin tearing down between the find and the assertion —
    // leaving an emptied node that fails the visibility check even though the
    // toast did appear.
    await screen.findByText("Export requested")
  },
}
