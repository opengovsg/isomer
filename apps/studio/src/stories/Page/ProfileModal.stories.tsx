import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"

import SitePage from "~/pages/sites/[siteId]"
import { ResetUpdateProfileModalDecorator } from "~/stories/decorators/resetModalState"

const COMMON_HANDLERS = [
  meHandlers.me(),
  resourceHandlers.getRolesFor.admin(),
  sitesHandlers.getSiteName.default(),
  pageHandlers.getRootPage.default(),
]

const meta: Meta<typeof SitePage> = {
  title: "Pages/Profile Management/Profile Modal",
  component: SitePage,
  parameters: {
    getLayout: SitePage.getLayout,
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
  decorators: [ResetUpdateProfileModalDecorator],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async (context) => {
    const screen = within(context.canvasElement)
    const testUserSelector = await screen.findByText(/TU/i)
    const testUserSelectorButton = testUserSelector.closest("button")
    if (testUserSelectorButton) {
      await userEvent.click(testUserSelectorButton)
    }
    const editProfileButton = await screen.findByText("Edit profile")
    await userEvent.click(editProfileButton, {
      pointerEventsCheck: 0,
    })
  },
}

export const Unfilled: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    // Check for name input
    const nameInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="name"][required]',
      ),
    )[0]
    if (nameInput) {
      await userEvent.clear(nameInput)
    }

    // Check for phone input
    const phoneInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="phone"][required]',
      ),
    )[0]
    if (phoneInput) {
      await userEvent.clear(phoneInput)
    }
  },
}

export const PhoneNumberNot8Digits: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const phoneInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="phone"][required]',
      ),
    )[0]
    if (phoneInput) {
      await userEvent.clear(phoneInput)
      await userEvent.type(phoneInput, "6512345678")
    }
  },
}

export const NonSingaporePhone: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const phoneInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="phone"][required]',
      ),
    )[0]
    if (phoneInput) {
      await userEvent.clear(phoneInput)
      await userEvent.type(phoneInput, "12345678")
    }
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [...COMMON_HANDLERS, userHandlers.updateDetails.loading()],
    },
  },
  play: async (context) => {
    await Default.play?.(context)

    const rootScreen = within(context.canvasElement.ownerDocument.body)
    const saveButton = await rootScreen.findByText("Save changes")
    await userEvent.click(saveButton, {
      pointerEventsCheck: 0,
    })
  },
}

export const Success: Story = {
  parameters: {
    msw: {
      handlers: [...COMMON_HANDLERS, userHandlers.updateDetails.success()],
    },
  },
  play: async (context) => {
    await Default.play?.(context)

    const rootScreen = within(context.canvasElement.ownerDocument.body)
    const saveButton = await rootScreen.findByText("Save changes")
    await userEvent.click(saveButton, {
      pointerEventsCheck: 0,
    })
  },
}
