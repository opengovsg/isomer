import { Story, Meta } from "@storybook/react"
import InfoPic, { InfopicProps } from "./Infopic"

export default {
  title: "Isomer/Infopic",
  component: InfoPic,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<InfopicProps> = (args) => <InfoPic {...args} />

// Default scenario
export const DefaultLeft = Template.bind({})
DefaultLeft.args = {
  sectionIndex: 0,
  title: "Thank you for attending the roadshows!",
  subtitle: "Coming soon to your hood",
  description: "Catch the highlights from the roadshows here.",
  alt: "alt",
  imageUrl: "https://picsum.photos/200/200",
  buttonLabel: "View more resources",
  buttonUrl: "www.google.com",
}

export const DefaultRight = Template.bind({})
DefaultRight.args = {
  sectionIndex: 1,
  title: "Thank you for attending the roadshows!",
  subtitle: "Coming soon to your hood",
  description: "Catch the highlights from the roadshows here.",
  alt: "alt",
  imageUrl: "https://picsum.photos/200/200",
  buttonLabel: "View more resources",
  buttonUrl: "www.google.com",
}

export const TitleAndDescriptionOnly = Template.bind({})
TitleAndDescriptionOnly.args = {
  sectionIndex: 0,
  title: "Thank you for attending the roadshows!",
  description: "Catch the highlights from the roadshows here.",
  alt: "alt",
  imageUrl: "https://picsum.photos/200/200",
}

export const InvalidImage = Template.bind({})
InvalidImage.args = {
  sectionIndex: 0,
  title: "Thank you for attending the roadshows!",
  subtitle: "Coming soon to your hood",
  description: "Catch the highlights from the roadshows here.",
  alt: "alt",
  imageUrl: "",
  buttonLabel: "View more resources",
  buttonUrl: "www.google.com",
}

