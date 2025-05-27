import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"

import UsersPage from "~/pages/sites/[siteId]/users"
import { ResetEditUserModalDecorator } from "../decorators/resetModalState"

const COMMON_HANDLERS = [
  meHandlers.me(),
  resourceHandlers.getRolesFor.admin(),
  sitesHandlers.getSiteName.default(),
  userHandlers.count.default(),
  userHandlers.list.users(),
]

const meta: Meta<typeof UsersPage> = {
  title: "Pages/Site Management/Users Page/Edit User Modal",
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
  decorators: [ResetEditUserModalDecorator],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)
    const screen = within(canvasElement)

    const actionMenu = await screen.findByRole("button", {
      name: "Options for Government Editor",
    })
    await userEvent.click(actionMenu)

    const editUserButton = await rootScreen.findByText("Edit user")
    await userEvent.click(editUserButton, { pointerEventsCheck: 0 })
  },
}

export const AdminWarningBanner: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const screen = within(canvasElement.ownerDocument.body)

    const AdminRoleButton = await screen.findByRole("button", {
      name: "Admin role",
    })
    await userEvent.click(AdminRoleButton)

    const adminWarningText = await screen.findByText(
      "You are adding a new admin to the website. An admin can make any change to the site content, settings, and users.",
    )
    await expect(adminWarningText).toBeVisible()
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [...COMMON_HANDLERS, userHandlers.update.loading()],
    },
  },
  play: async (context) => {
    const { canvasElement } = context
    await AdminWarningBanner.play?.(context)

    const screen = within(canvasElement.ownerDocument.body)

    const saveChangesButton = await screen.findByText("Save changes")
    await userEvent.click(saveChangesButton)
  },
}

export const ToastAfterEditingUser: Story = {
  parameters: {
    msw: {
      handlers: [...COMMON_HANDLERS, userHandlers.update.success()],
    },
  },
  play: async (context) => {
    const { canvasElement } = context
    await AdminWarningBanner.play?.(context)

    const screen = within(canvasElement.ownerDocument.body)

    const saveChangesButton = await screen.findByText("Save changes")
    await userEvent.click(saveChangesButton)
  },
}

export const NonGovEmailCannotBeAdmin: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const rootScreen = within(canvasElement.ownerDocument.body)
    const screen = within(canvasElement)

    const actionMenu = await screen.findByRole("button", {
      name: "Options for Editor User",
    })
    await userEvent.click(actionMenu)

    const editUserButton = await rootScreen.findByText("Edit user")
    await userEvent.click(editUserButton, { pointerEventsCheck: 0 })
  },
}
