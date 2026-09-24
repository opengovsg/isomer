import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, waitFor, within } from "storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { PermissionsProvider } from "~/features/permissions"

import PublishButton from "./PublishButton"

// PublishButton renders its own <Can> gate, which reads the ability built by
// PermissionsProvider from the user's roles. Each story below swaps the
// `getRolesFor` handler to demonstrate what every role sees.
const COMMON_HANDLERS = [meHandlers.me(), pageHandlers.readPage.content()]

const meta: Meta<typeof PublishButton> = {
  title: "Components/PublishButton",
  component: PublishButton,
  args: { pageId: 1, siteId: 1 },
  decorators: [
    (Story) => (
      <PermissionsProvider siteId={1} resourceId="1">
        <Story />
      </PermissionsProvider>
    ),
  ],
  parameters: {
    msw: { handlers: COMMON_HANDLERS },
    nextjs: {
      router: {
        query: { siteId: "1", pageId: "1" },
        pathname: "/sites/[siteId]/pages/[pageId]",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const handlersForRole = (
  roleHandler: ReturnType<typeof resourceHandlers.getRolesFor.admin>,
) => ({ msw: { handlers: [...COMMON_HANDLERS, roleHandler] } })

// Admins have full permissions, including publish.
export const Admin: Story = {
  parameters: handlersForRole(resourceHandlers.getRolesFor.admin()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () =>
      expect(
        await canvas.findByRole("button", { name: "Publish" }),
      ).toBeVisible(),
    )
  },
}

// Publishers are the dedicated publish role.
export const Publisher: Story = {
  parameters: handlersForRole(resourceHandlers.getRolesFor.publisher()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () =>
      expect(
        await canvas.findByRole("button", { name: "Publish" }),
      ).toBeVisible(),
    )
  },
}

// Editors cannot publish — the button must not render for them.
export const Editor: Story = {
  parameters: handlersForRole(resourceHandlers.getRolesFor.editor()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: "Publish" }),
      ).not.toBeInTheDocument(),
    )
  },
}
