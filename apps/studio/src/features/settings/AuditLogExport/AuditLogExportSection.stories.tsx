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
const COMMON_HANDLERS = [meHandlers.me(), resourceHandlers.getRolesFor.admin()]

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
        pathname: "/sites/[siteId]/settings/audit",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Admin, form ready with the defaults pre-filled.
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () =>
      expect(
        await canvas.findByRole("button", { name: "Request export" }),
      ).toBeEnabled(),
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
    const button = await canvas.findByRole("button", {
      name: "Request export",
    })
    await userEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
  },
}

// Error state — a duplicate request already in flight surfaces a toast.
export const Conflict: Story = {
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        auditHandlers.createExportRequest.conflict(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: "Request export",
    })
    await userEvent.click(button)
    await waitFor(async () =>
      expect(
        await within(document.body).findByText(
          "An export for this period and report type is already being generated",
        ),
      ).toBeVisible(),
    )
  },
}
