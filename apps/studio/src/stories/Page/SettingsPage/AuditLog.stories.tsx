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

// Admin, initial empty state: no log type picked, so the submit button is the
// disabled "Select log types to export" call-to-action.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await waitFor(async () =>
      expect(
        await screen.findByRole("button", {
          name: "Select log types to export",
        }),
      ).toBeDisabled(),
    )
  },
}

// Selecting "Audit logs" reveals the month picker and arms the submit button.
export const AuditLogSelected: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await screen.findByRole("checkbox", { name: /Audit logs/ }),
    )
    await expect(await screen.findByText("For the month of")).toBeVisible()
    await expect(
      screen.getByRole("button", { name: "Export log" }),
    ).toBeEnabled()
  },
}

// Submitting shows the success toast: generation is async and the download
// link arrives by email.
export const ExportRequested: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await screen.findByRole("checkbox", { name: /User access review logs/ }),
    )
    await userEvent.click(screen.getByRole("button", { name: "Export log" }), {
      pointerEventsCheck: 0,
    })
    await expect(await screen.findByText("Export requested")).toBeVisible()
  },
}
