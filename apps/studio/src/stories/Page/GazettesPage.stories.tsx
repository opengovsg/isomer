import type { Meta, StoryObj } from "@storybook/nextjs"
import GazettesPage from "~/pages/sites/[siteId]/gazettes"

import { ADMIN_HANDLERS } from "../handlers"

const meta: Meta<typeof GazettesPage> = {
  title: "Pages/eGazette/Gazettes Page",
  component: GazettesPage,
  parameters: {
    getLayout: GazettesPage.getLayout,
    msw: {
      handlers: [...ADMIN_HANDLERS],
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
  args: {},
}
