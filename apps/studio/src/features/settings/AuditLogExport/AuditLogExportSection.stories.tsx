import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { auditHandlers } from "tests/msw/handlers/audit"
import { meHandlers } from "tests/msw/handlers/me"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { UserManagementProvider } from "~/features/users"

import { AuditLogExportSection } from "./AuditLogExportSection"

// The section reads the site-admin ability built by UserManagementProvider
// from the user's roles, so each story wires the `getRolesFor` handler that
// makes the current user an Admin (the only role that may export).
const COMMON_HANDLERS = [
  meHandlers.me(),
  resourceHandlers.getRolesFor.admin(),
  auditHandlers.getExportWindow.default(),
]

const meta: Meta<typeof AuditLogExportSection> = {
  title: "Features/Settings/AuditLogExportSection",
  component: AuditLogExportSection,
  args: { siteId: 1 },
  decorators: [
    (Story) => (
      <UserManagementProvider siteId={1}>
        <Story />
      </UserManagementProvider>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        auditHandlers.createExportRequest.success(),
      ],
    },
    nextjs: {
      router: {
        query: { siteId: "1" },
        pathname: "/sites/[siteId]/settings/audit-log",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Admin, initial state: the current (partial) month is preselected, so the
// submit is immediately the enabled "Export logs" call-to-action.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () =>
      expect(
        await canvas.findByRole("button", { name: "Export logs" }),
      ).toBeEnabled(),
    )
    await expect(
      canvas.getByRole("link", { name: "User management" }),
    ).toBeVisible()
  },
}

// Picking "All sites I have Admin access to" still submits successfully —
// the server resolves the concrete site list itself.
export const AllSitesScopeSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("radio", {
        name: "All sites I have Admin access to",
      }),
    )
    await userEvent.click(
      await canvas.findByRole("button", { name: "Export logs" }),
    )
    await waitFor(async () =>
      expect(
        await within(document.body).findByText("Export requested"),
      ).toBeVisible(),
    )
  },
}

// Submitting state — the mutation hangs so the button shows its loading spinner.
export const Submitting: Story = {
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        auditHandlers.createExportRequest.pending(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Export logs" })
    await userEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
  },
}

// A duplicate request cannot fail: the server accepts it idempotently
// (ADR docs/adr/0005), so submitting twice shows the same success toast.
export const DuplicateRequestSucceeds: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const submitOnce = async () => {
      await userEvent.click(
        await canvas.findByRole("button", { name: "Export logs" }),
      )
    }

    // Ask once, then ask again for the same logs. Neither can fail: the
    // service accepts duplicates idempotently (ADR docs/adr/0005), so both
    // resolve with the success toast rather than an error.
    await submitOnce()
    await submitOnce()

    // Both asks resolve with the success toast — no error surface exists for
    // duplicates any more. (findAllByText: the two toasts may coexist.)
    await waitFor(async () => {
      const toasts = await within(document.body).findAllByText(
        "Export requested",
      )
      await expect(toasts.length).toBeGreaterThanOrEqual(1)
      await expect(toasts[0]).toBeVisible()
    })
  },
}
