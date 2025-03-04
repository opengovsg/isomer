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
  userHandlers.hasInactiveUsers.true(),
]

const meta: Meta<typeof UsersPage> = {
  title: "Pages/Site Management/Users Page/Remove User Modal",
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

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        userHandlers.getPermissions.admin(),
        userHandlers.list.users(),
        userHandlers.getUser.default(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)
    const screen = within(canvasElement)

    const actionMenu = await screen.findByRole("button", {
      name: "Options for Admin User",
    })
    await userEvent.click(actionMenu)

    const removeUserButton = await rootScreen.findByText("Remove user access")
    await userEvent.click(removeUserButton, {
      pointerEventsCheck: 0,
    })
  },
}
