import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"
import { whitelistHandlers } from "tests/msw/handlers/whitelist"

import UsersPage from "~/pages/sites/[siteId]/users"
import { ResetAddUserModalDecorator } from "../decorators/resetModalState"

const EMAIL = "chillguy@isomer.gov.sg"
const COMMON_HANDLERS = [
  meHandlers.me(),
  resourceHandlers.getRolesFor.default(),
  sitesHandlers.getSiteName.default(),
  userHandlers.count.default(),
  userHandlers.getPermissions.admin(),
]

const meta: Meta<typeof UsersPage> = {
  title: "Pages/Site Management/Users Page/Add User Modal",
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
  decorators: [ResetAddUserModalDecorator],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    // Wait for 1 seconds before proceeding
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const addUserButtons = await screen.findAllByText("Add new user")
    const addUserButton = addUserButtons[0] // take the first one
    if (addUserButton) {
      await userEvent.click(addUserButton, {
        pointerEventsCheck: 0,
      })
    }
  },
}

export const InvalidEmail: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const emailInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="email"][required]',
      ),
    )[0]
    if (emailInput) {
      await userEvent.type(emailInput, "invalid-email")
    }

    const screen = within(canvasElement.ownerDocument.body)
    const errorMessage = await screen.findByText(
      "This doesn't look like a valid email address.",
    )
    await expect(errorMessage).toBeVisible()
  },
}

export const AdminWarningBanner: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const screen = within(canvasElement.ownerDocument.body)
    const AdminRoleButton = await screen.findByText("Admin")
    await userEvent.click(AdminRoleButton)

    const adminWarningText = await screen.findByText(
      "You are adding a new admin to the website. An admin can make any change to the site content, settings, and users.",
    )
    await expect(adminWarningText).toBeVisible()
  },
}

export const NonGovEmailCannotBeAdmin: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const screen = within(canvasElement.ownerDocument.body)
    const AdminRoleButton = await screen.findByText("Admin")
    await userEvent.click(AdminRoleButton)

    const emailInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="email"][required]',
      ),
    )[0]
    if (emailInput) {
      await userEvent.type(emailInput, "this_is_a_non_gov_email@non-gov.sg")
    }

    const nonGovEmailCannotBeAdminText = await screen.findByText(
      "Non-gov.sg emails cannot be added as admin. Select another role.",
    )
    await expect(nonGovEmailCannotBeAdminText).toBeVisible()
  },
}

export const EmailIsNotWhitelisted: Story = {
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        whitelistHandlers.isEmailWhitelisted.false(),
      ],
    },
  },
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const screen = within(canvasElement.ownerDocument.body)

    const emailInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="email"][required]',
      ),
    )[0]
    if (emailInput) {
      await userEvent.type(emailInput, "blink@ifyouneed.help")
    }

    const nonGovEmailCannotBeAdminText = await screen.findByText(
      "There are non-gov.sg domains that need to be whitelisted. Chat with Isomer Support to whitelist domains.",
    )
    await expect(nonGovEmailCannotBeAdminText).toBeVisible()
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [...COMMON_HANDLERS, userHandlers.create.loading()],
    },
  },
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const screen = within(canvasElement.ownerDocument.body)
    const emailInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="email"][required]',
      ),
    )[0]

    if (emailInput) {
      await userEvent.type(emailInput, EMAIL)
    }

    // Find the Send invite button
    const sendInviteButton = await screen.findByText("Send invite")

    // Wait for 1 seconds before proceeding
    // As there is a 500ms debounce on the email input
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Wait for the button to be enabled
    await expect(sendInviteButton).not.toBeDisabled()

    // Click the button
    await userEvent.click(sendInviteButton)
  },
}

export const ToastAfterAddingUser: Story = {
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        userHandlers.create.success({ email: EMAIL }),
      ],
    },
  },
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const screen = within(canvasElement.ownerDocument.body)
    const emailInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="email"][required]',
      ),
    )[0]

    if (emailInput) {
      await userEvent.type(emailInput, EMAIL)
    }

    // Find the Send invite button
    const sendInviteButton = await screen.findByText("Send invite")

    // Wait for 1 seconds before proceeding
    // As there is a 500ms debounce on the email input
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Wait for the button to be enabled
    await expect(sendInviteButton).not.toBeDisabled()

    // Click the button
    await userEvent.click(sendInviteButton)
  },
}
