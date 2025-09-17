import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import { userHandlers } from "tests/msw/handlers/user"

import UsersPage from "~/pages/sites/[siteId]/users"
import { ResetRemoveUserModalDecorator } from "~/stories/decorators/resetModalState"
import { createSingpassEnabledGbParameters } from "~/stories/utils/growthbook"
import { COMMON_HANDLERS } from "../handlers"

const SHARED_HANDLERS = [
  ...COMMON_HANDLERS,
  userHandlers.list.removeUserModal(),
  userHandlers.getUser.default(),
]

const meta: Meta<typeof UsersPage> = {
  title: "Pages/Site Management/Users Page/Remove User Modal",
  component: UsersPage,
  parameters: {
    getLayout: UsersPage.getLayout,
    growthbook: [createSingpassEnabledGbParameters(true)],
    msw: {
      handlers: SHARED_HANDLERS,
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
        },
      },
    },
  },
  decorators: [ResetRemoveUserModalDecorator],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    msw: {
      handlers: SHARED_HANDLERS,
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

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [...SHARED_HANDLERS, userHandlers.delete.loading()],
    },
  },
  play: async (context) => {
    await Default.play?.(context)

    const rootScreen = within(context.canvasElement.ownerDocument.body)
    const removeUserButton = await rootScreen.findByText("Remove user")
    await userEvent.click(removeUserButton, {
      pointerEventsCheck: 0,
    })
  },
}

export const Success: Story = {
  parameters: {
    msw: {
      handlers: [...SHARED_HANDLERS, userHandlers.delete.success()],
    },
  },
  play: async (context) => {
    await Default.play?.(context)

    const rootScreen = within(context.canvasElement.ownerDocument.body)
    const removeUserButton = await rootScreen.findByText("Remove user")
    await userEvent.click(removeUserButton, {
      pointerEventsCheck: 0,
    })
  },
}
