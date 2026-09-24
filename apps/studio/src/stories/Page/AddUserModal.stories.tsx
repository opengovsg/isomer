import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"
import { whitelistHandlers } from "tests/msw/handlers/whitelist"
import UsersPage from "~/pages/sites/[siteId]/users"
import { createSingpassEnabledGbParameters } from "~/stories/utils/growthbook"

import { ResetAddUserModalDecorator } from "../decorators"

const EMAIL = "chillguy@isomer.gov.sg"
const COMMON_HANDLERS = [
  meHandlers.me(),
  resourceHandlers.getRolesFor.admin(),
  sitesHandlers.getSiteName.default(),
  userHandlers.count.default(),
]

const meta: Meta<typeof UsersPage> = {
  title: "Pages/Site Management/Users Page/Add User Modal",
  component: UsersPage,
  parameters: {
    getLayout: UsersPage.getLayout,
    growthbook: [createSingpassEnabledGbParameters(true)],
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

// Selecting Admin no longer has any whitelist-specific effect of its own —
// there's no longer a distinction between Admin and any other role. A
// non-whitelisted non-gov.sg email still blocks the invite, but via the
// same general "needs whitelisting" gate that blocks every role, not an
// Admin-specific one: the Admin warning still shows (role is selected),
// but Send invite stays disabled because the email itself isn't whitelisted.
export const AdminSelectionDoesNotBypassWhitelistGate: Story = {
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
    const AdminRoleButton = await screen.findByText("Admin")
    await userEvent.click(AdminRoleButton)

    const emailInput = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="email"][required]',
      ),
    )[0]
    if (emailInput) {
      await userEvent.type(emailInput, "someone@non-whitelisted-domain.com")
    }

    const adminWarningText = await screen.findByText(
      "You are adding a new admin to the website. An admin can make any change to the site content, settings, and users.",
    )
    await expect(adminWarningText).toBeVisible()

    const whitelistErrorText = await screen.findByText(
      "There are non-gov.sg domains that need to be whitelisted. Chat with Isomer Support to whitelist domains.",
    )
    await expect(whitelistErrorText).toBeVisible()

    const sendInviteButton = await screen.findByText("Send invite")
    await waitFor(() => expect(sendInviteButton).toBeDisabled())
  },
}

// Regression test for the fix allowing Admin for any whitelisted non-gov.sg
// email — permanent or temporary (vendor) grants are treated identically, so
// mocking isEmailWhitelisted: true covers both.
export const NonGovEmailWhitelistedForAdmin: Story = {
  parameters: {
    msw: {
      handlers: [
        ...COMMON_HANDLERS,
        whitelistHandlers.isEmailWhitelisted.true(),
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
      await userEvent.type(emailInput, "someone@whitelisted-non-gov-domain.com")
    }

    const AdminRoleButton = await screen.findByRole("button", {
      name: "Admin role",
    })
    await userEvent.click(AdminRoleButton)

    const adminWarningText = await screen.findByText(
      "You are adding a new admin to the website. An admin can make any change to the site content, settings, and users.",
    )
    await expect(adminWarningText).toBeVisible()

    const sendInviteButton = await screen.findByText("Send invite")
    await waitFor(() => expect(sendInviteButton).not.toBeDisabled())
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
    // As there is a 300ms debounce on the email input
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
    // As there is a 300ms debounce on the email input
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Wait for the button to be enabled
    await expect(sendInviteButton).not.toBeDisabled()

    // Click the button
    await userEvent.click(sendInviteButton)
  },
}
