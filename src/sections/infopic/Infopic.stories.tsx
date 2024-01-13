import { Meta, StoryFn } from "@storybook/react"

import { Infopic, InfopicProps } from "./Infopic"

export default {
  title: "Components/Infopic",
  component: Infopic,
  tags: ["autodocs"],
} as Meta

const InfopicTemplate: StoryFn<InfopicProps> = (args) => <Infopic {...args} />

export const Default = InfopicTemplate.bind({})
Default.args = {
  sectionIndex: 1,
  title: "Thank you for attending the roadshows!",
  subtitle: "Coming soon to your hood",
  description: "Catch the highlights from the roadshows here.",
  alt: "alt",
  image: "/.storybook/assets/balloon.png",
  button: "View more resources",
  url: "www.google.com",
}
