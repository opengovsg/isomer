import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"

import UsersPage from "~/pages/sites/[siteId]/users"
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
      handlers: [
        ...ADMIN_HANDLERS,
        resourceHandlers.getRolesFor.publisher(),
        userHandlers.list.users(),
      ],
    },
  },
}

export const Editor: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        resourceHandlers.getRolesFor.editor(),
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
