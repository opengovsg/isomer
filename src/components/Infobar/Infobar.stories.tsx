import { Meta, StoryFn } from "@storybook/react"

import { Infobar, InfobarProps } from "./Infobar"

export default {
  title: "Components/Infobar",
  component: Infobar,
  tags: ["autodocs"],
} as Meta

const InfobarTemplate: StoryFn<InfobarProps> = (args) => <Infobar {...args} />

export const Default = InfobarTemplate.bind({})
Default.args = {
  sectionIndex: 1,
  title: "Infobar Title!!",
  subtitle: "Isomer next",
  description: "About a sentence worth of description here.",
  button: "View more",
  url: "www.google.com",
}
