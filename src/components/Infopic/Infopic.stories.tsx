import { Story, Meta } from "@storybook/react"
import Infopic, { InfopicProps } from "./Infopic"

export default {
  title: "Isomer/Infopic",
  component: Infopic,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<InfopicProps> = (args) => <Infopic {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  sectionIndex: 1,
  title: "Thank you for attending the roadshows!",
  subtitle: "Coming soon to your hood",
  description: "Catch the highlights from the roadshows here.",
  alt: "alt",
  image: "https://picsum.photos/200/200",
  button: "View more resources",
  url: "www.google.com",
}
