import type { Meta, StoryFn } from "@storybook/react"
import Content from "./Content"
import { ContentPageSchema } from "~/engine"

export default {
  title: "Next/Layouts/Content",
  component: Content,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<ContentPageSchema> = (args) => <Content {...args} />

export const Default = Template.bind({})
Default.args = {
  layout: "content",
  site: {
    siteName: "Isomer Next",
    siteMap: [],
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    navBarItems: [],
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
  },
  page: {
    title: "Content page",
    description: "A Next.js starter for Isomer",
  },
  content: [
    {
      type: "paragraph",
      content: "This is a text component",
    },
    {
      type: "paragraph",
      content: "This is another text component",
    },
    {
      type: "paragraph",
      content: "This is yet another text component",
    },
  ],
}
