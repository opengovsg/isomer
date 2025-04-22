import type { Meta, StoryObj } from "@storybook/react"

import type { CalloutProps } from "~/interfaces"
import Callout from "./Callout"

const meta: Meta<CalloutProps> = {
  title: "Next/Components/Callout",
  component: Callout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Callout>

// Default scenario
export const Default: Story = {
  args: {
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "searchSG",
        clientId: "",
      },
    },
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
            },
          ],
        },
      ],
    },
  },
}
