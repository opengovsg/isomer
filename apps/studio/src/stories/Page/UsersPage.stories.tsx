import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"

import UsersPage from "~/pages/sites/[siteId]/users"

const COMMON_HANDLERS = [
  meHandlers.me(),
  resourceHandlers.getRolesFor.default(),
  sitesHandlers.getSiteName.default(),
  userHandlers.count.default(),
  userHandlers.hasInactiveUsers.default(),
]

const meta: Meta<typeof UsersPage> = {
  title: "Pages/Site Management/Users Page",
  component: UsersPage,
  parameters: {
    getLayout: UsersPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
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
        ...COMMON_HANDLERS,
        userHandlers.getPermissions.admin(),
        userHandlers.list.users(),
      ],
    },
  },
}

export const Publisher: Story = {
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        userHandlers.getPermissions.publisher(),
        userHandlers.list.users(),
      ],
    },
  },
}

export const Editor: Story = {
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        userHandlers.getPermissions.editor(),
        userHandlers.list.users(),
      ],
    },
  },
}

export const ExpandedMenu: Story = {
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        userHandlers.getPermissions.admin(),
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
        ...COMMON_HANDLERS,
        userHandlers.getPermissions.admin(),
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
