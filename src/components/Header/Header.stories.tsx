import { Story, Meta } from "@storybook/react"
import Header, { HeaderProps } from "./Header"

export default {
  title: "Isomer/Header",
  component: Header,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<HeaderProps> = (args) => <Header {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  permalink: "/hello/world",
  sitemap: {
    "/": {
      title: "Home",
      paths: {
        "/hello": {
          title: "Hello",
          paths: {
            "/hello/world": {
              title: "DJAOJDWOIJWADOIJWDAIOJWAO",
              paths: {},
            },
          },
        },
      },
    },
  },
}
