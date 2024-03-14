import type { Meta, StoryFn } from "@storybook/react"
import Breadcrumb from "./Breadcrumb"
import BreadcrumbProps from "~/common/Breadcrumb"

export default {
  title: "Next/Components/Breadcrumb",
  component: Breadcrumb,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<BreadcrumbProps> = (args) => <Breadcrumb {...args} />

export const Default = Template.bind({})
Default.args = {
  links: [
    {
      title: "Irrationality",
      url: "/irrationality",
    },
    {
      title: "For Individuals",
      url: "/irrationality/individuals",
    },
    {
      title: "Steven Pinker's Rationality",
      url: "/irrationality/individuals/pinker-rationality",
    },
  ],
}
