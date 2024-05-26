import { Meta, StoryFn } from "@storybook/react"
import Pill from "./Pill"
import type { PillProps } from "~/interfaces"

export default {
  title: "Next/Internal Components/Pill",
  component: Pill,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

const Template: StoryFn<PillProps> = (args) => <Pill {...args} />

export const Default = Template.bind({})
Default.args = {
  content: "Press Release",
  onClose: () => window.alert("Closed pill"),
}
