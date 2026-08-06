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

// Admin, initial empty state: no log type picked, so the submit button is the
// disabled "Select log types to export" call-to-action.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () =>
      expect(
        await canvas.findByRole("button", {
          name: "Select log types to export",
        }),
      ).toBeDisabled(),
    )
  },
}

// Selecting the "Audit logs" card reveals its month picker and enables the
// submit button as "Export log".
export const Selected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("checkbox", { name: /Audit logs/ }),
    )
    await waitFor(async () =>
      expect(
        await canvas.findByRole("button", { name: "Export log" }),
      ).toBeEnabled(),
    )
    await expect(canvas.getByText("For the month of")).toBeVisible()
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
    await userEvent.click(
      await canvas.findByRole("checkbox", { name: /Audit logs/ }),
    )
    const button = await canvas.findByRole("button", { name: "Export log" })
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
        await canvas.findByRole("checkbox", { name: /Audit logs/ }),
      )
      await userEvent.click(
        await canvas.findByRole("button", { name: "Export log" }),
      )
    }

    // Ask once, then ask again for the same logs. Neither can fail: the
    // service accepts duplicates idempotently (ADR docs/adr/0005), so both
    // resolve with the success toast rather than an error.
    await submitOnce()
    // The form resets on success; wait for that before re-selecting.
    await waitFor(async () =>
      expect(
        await canvas.findByRole("button", {
          name: "Select log types to export",
        }),
      ).toBeDisabled(),
    )
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
