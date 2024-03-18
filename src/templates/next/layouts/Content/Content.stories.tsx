import type { Meta, StoryFn } from "@storybook/react"
import Content from "./Content"
import { IsomerPageSchema } from "~/engine"

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
const Template: StoryFn<IsomerPageSchema> = (args) => <Content {...args} />

export const Default = Template.bind({})
Default.args = {
  site: {
    siteName: "Isomer Next",
    siteMap: [],
    theme: "next",
    language: "en",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.png",
  },
  page: {
    layout: "content",
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
