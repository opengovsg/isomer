import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, within } from "storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"
import SitePage from "~/pages/sites/[siteId]"
import { ResetUpdateProfileModalDecorator } from "~/stories/decorators"

const COMMON_HANDLERS = {
  me: meHandlers.me(),
  roles: resourceHandlers.getRolesFor.admin(),
  siteName: sitesHandlers.getSiteName.default(),
  rootPage: pageHandlers.getRootPage.default(),
}

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
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [ResetUpdateProfileModalDecorator],
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

export const Required: Story = {
  parameters: {
    msw: {
      handlers: {
        ...COMMON_HANDLERS,
        me: meHandlers.notOnboarded(),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    const modalHeader = await screen.findByText(
      "Welcome to Studio! Tell us about yourself.",
    )

    await expect(modalHeader).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await expect(modalHeader).toBeVisible()
  },
}

export const Unfilled: Story = {
  decorators: [ResetUpdateProfileModalDecorator],
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
  decorators: [ResetUpdateProfileModalDecorator],
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
  decorators: [ResetUpdateProfileModalDecorator],
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
  decorators: [ResetUpdateProfileModalDecorator],
  parameters: {
    msw: {
      handlers: {
        ...COMMON_HANDLERS,
        updateDetails: userHandlers.updateDetails.loading(),
      },
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
  decorators: [ResetUpdateProfileModalDecorator],
  parameters: {
    msw: {
      handlers: {
        ...COMMON_HANDLERS,
        updateDetails: userHandlers.updateDetails.success(),
      },
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
