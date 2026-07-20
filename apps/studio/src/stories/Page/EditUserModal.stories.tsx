import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { userHandlers } from "tests/msw/handlers/user"
import { whitelistHandlers } from "tests/msw/handlers/whitelist"
import UsersPage from "~/pages/sites/[siteId]/users"
import { createSingpassEnabledGbParameters } from "~/stories/utils/growthbook"

import { ResetEditUserModalDecorator } from "../decorators"
import { ADMIN_HANDLERS } from "../handlers"

const meta: Meta<typeof UsersPage> = {
  title: "Pages/Site Management/Users Page/Edit User Modal",
  component: UsersPage,
  parameters: {
    getLayout: UsersPage.getLayout,
    growthbook: [createSingpassEnabledGbParameters(true)],
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
      handlers: [...ADMIN_HANDLERS, userHandlers.update.loading()],
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
    disableMockDate: true,
    msw: {
      handlers: [...ADMIN_HANDLERS, userHandlers.update.success()],
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

// "Editor User" (editor@example.com) is a non-gov.sg email that is not
// permanently whitelisted for Admin — this represents either a wholly
// non-whitelisted domain, or a vendor (temporarily whitelisted) one; from
// this modal's perspective they're indistinguishable, since Admin
// eligibility here depends only on isEmailWhitelistedAdmin.
export const VendorEmailCannotBeAdmin: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        whitelistHandlers.isEmailWhitelistedAdmin.false(),
      ],
    },
  },
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

    // The Admin box starts (and stays) disabled here: the email is fixed as
    // soon as the modal opens, so unlike AddUserModal there's no "type the
    // email after selecting Admin" window — a click on a disabled button
    // never fires onClick, so selectedRole can never become Admin and the
    // "cannot be admin" banner can never render. The observable regression
    // check is therefore that the box stays disabled, not a banner click-through.
    const AdminRoleButton = await rootScreen.findByRole("button", {
      name: "Admin role",
    })
    await waitFor(() => expect(AdminRoleButton).toBeDisabled())
  },
}

// Regression test for the fix allowing Admin for non-gov.sg emails whose
// domain has a permanent whitelist grant.
export const NonGovEmailWhitelistedForAdmin: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        whitelistHandlers.isEmailWhitelistedAdmin.true(),
      ],
    },
  },
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

    const AdminRoleButton = await rootScreen.findByRole("button", {
      name: "Admin role",
    })
    await waitFor(() => expect(AdminRoleButton).not.toBeDisabled())

    await userEvent.click(AdminRoleButton)

    const adminWarningText = await rootScreen.findByText(
      "You are adding a new admin to the website. An admin can make any change to the site content, settings, and users.",
    )
    await expect(adminWarningText).toBeVisible()
  },
}
