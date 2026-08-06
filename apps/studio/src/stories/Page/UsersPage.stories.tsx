import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, within } from "storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"
import UsersPage from "~/pages/sites/[siteId]/users"
import { createAuditLogEnabledGbParameters } from "~/stories/utils/growthbook"

import { ADMIN_HANDLERS } from "../handlers"

const meta: Meta<typeof UsersPage> = {
  title: "Pages/Site Management/Users Page",
  component: UsersPage,
  parameters: {
    getLayout: UsersPage.getLayout,
    msw: {
      handlers: ADMIN_HANDLERS,
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
        },
      },
    },
  },
  decorators: [],
}

export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        resourceHandlers.getRolesFor.admin(),
        userHandlers.list.users(),
      ],
    },
  },
}

export const Publisher: Story = {
  parameters: {
    msw: {
      // The role override must come before the `ADMIN_HANDLERS` spread: MSW
      // resolves the *first* matching handler in the array, and ADMIN_HANDLERS
      // already registers its own `getRolesFor` (Admin) handler.
      handlers: [
        resourceHandlers.getRolesFor.publisher(),
        ...ADMIN_HANDLERS,
        userHandlers.list.users(),
      ],
    },
  },
}

export const Editor: Story = {
  parameters: {
    msw: {
      // See the ordering note on the Publisher story above.
      handlers: [
        resourceHandlers.getRolesFor.editor(),
        ...ADMIN_HANDLERS,
        userHandlers.list.users(),
      ],
    },
  },
}

export const ExpandedMenu: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        resourceHandlers.getRolesFor.admin(),
        userHandlers.list.users(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const actionMenu = await screen.findByRole("button", {
      name: "Options for Admin User",
    })
    await userEvent.click(actionMenu)
  },
}

export const IsomerAdminsTab: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        resourceHandlers.getRolesFor.admin(),
        userHandlers.list.isomerAdmins(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const isomerAdminsTab = await screen.findByText("Isomer admins")
    await userEvent.click(isomerAdminsTab)
  },
}

export const NoUsers: Story = {
  parameters: {
    msw: {
      handlers: [
        meHandlers.me(),
        resourceHandlers.getRolesFor.admin(),
        sitesHandlers.getSiteName.default(),
        userHandlers.list.noUsers(),
        userHandlers.count.noUsers(),
      ],
    },
  },
}

// With the is-audit-log-enabled flag on, an admin also sees the "Export
// access logs" button beside "Add new user". The other stories leave the flag
// off (its default), so they double as coverage for the hidden state.
export const AdminWithAuditLogExport: Story = {
  parameters: {
    growthbook: [createAuditLogEnabledGbParameters(true)],
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        resourceHandlers.getRolesFor.admin(),
        userHandlers.list.users(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await expect(
      await screen.findByRole("button", { name: "Export access logs" }),
    ).toBeEnabled()
  },
}

// Exporting access logs is admin-only: even with the flag on, editors never
// see the button at all.
export const EditorWithAuditLogExport: Story = {
  parameters: {
    growthbook: [createAuditLogEnabledGbParameters(true)],
    msw: {
      // See the ordering note on the Publisher story above — without this,
      // ADMIN_HANDLERS' own Admin role handler wins and the button (wrongly)
      // shows.
      handlers: [
        resourceHandlers.getRolesFor.editor(),
        ...ADMIN_HANDLERS,
        userHandlers.list.users(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    // Anchor on the page having rendered before asserting the absence.
    await screen.findByRole("button", { name: "Add new user" })
    await expect(
      screen.queryByRole("button", { name: "Export access logs" }),
    ).toBeNull()
  },
}
