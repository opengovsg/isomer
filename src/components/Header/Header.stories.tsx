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
    title: "Home",
    permalink: "/",
    paths: [
      {
        permalink: "/about-isomer",
        title: "about-isomer",
        paths: [
          {
            permalink: "/about-isomer/our-background/",
            title: "Our background",
            paths: [],
          },
          {
            permalink: "/about-isomer/what-is-isomer",
            title: "What is Isomer",
            paths: [
              {
                permalink: "/about-isomer/what-is-isomer/overview/",
                title: "Overview",
                paths: [],
              },
              {
                permalink: "/about-isomer/what-is-isomer/isomer-template/",
                title: "The Isomer template",
                paths: [],
              },
              {
                permalink: "/about-isomer/what-is-isomer/isomer-infra/",
                title: "Isomer's infrastructure",
                paths: [],
              },
              {
                permalink: "/about-isomer/what-is-isomer/isomercms/",
                title: "IsomerCMS",
                paths: [],
              },
            ],
          },
          {
            permalink: "/about-isomer/who-uses-isomer/",
            title: "Who uses Isomer",
            paths: [],
          },
          {
            permalink: "/about-isomer/why-use-isomer/",
            title: "Why use Isomer",
            paths: [],
          },
        ],
      },
      {
        permalink: "/contact-us/",
        title: "Contact Us",
        paths: [],
      },
    ],
  },
}
