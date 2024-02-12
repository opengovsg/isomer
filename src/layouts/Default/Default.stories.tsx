import { Story, Meta } from "@storybook/react"
import DefaultLayout, { DefaultLayoutProps } from "./Default"

export default {
  title: "Isomer/Layouts/Default",
  component: DefaultLayout,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<DefaultLayoutProps> = (args) => (
  <DefaultLayout {...args} />
)

// Default scenario
export const Default = Template.bind({})
Default.args = {
  navbar: {
    id: "Navbar",
    components: [
      {
        id: "Navbar",
        props: {
          logo: {
            url: "https://www.isomer.gov.sg/images/isomer-logo.svg",
            alt: "Isomer logo",
          },
          links: [
            {
              type: "dropdown",
              name: "About Isomer",
              eventKey: "about-isomer",
              links: [
                {
                  type: "single",
                  name: "What is Isomer",
                  url: "/about-isomer/what-is-isomer/overview/",
                },
                {
                  type: "single",
                  name: "Why use Isomer",
                  url: "/about-isomer/why-use-isomer/",
                },
                {
                  type: "single",
                  name: "Who uses Isomer",
                  url: "/about-isomer/who-uses-isomer/",
                },
              ],
            },
            {
              type: "dropdown",
              name: "When To Use Isomer",
              eventKey: "when-to-use-isomer",
              links: [
                {
                  type: "single",
                  name: "What are the use cases for Isomer?",
                  url: "/when-to-use-isomer/use-cases/",
                },
                {
                  type: "single",
                  name: "What are static websites",
                  url: "/when-to-use-isomer/static-websites/",
                },
                {
                  type: "single",
                  name: "Advance integrations",
                  url: "/when-to-use-isomer/advance-integrations/",
                },
              ],
            },
            {
              type: "dropdown",
              name: "Getting Started",
              eventKey: "getting-started",
              links: [
                {
                  type: "single",
                  name: "What to expect",
                  url: "/getting-started/what-to-expect/",
                },
                {
                  type: "single",
                  name: "Roles & responsibilities",
                  url: "/getting-started/roles-and-responsibilities/",
                },
                {
                  type: "single",
                  name: "FAQs",
                  url: "/getting-started/faqs/general/",
                },
              ],
            },
            {
              type: "single",
              name: "Other resources",
              eventKey: "other-resources",
              url: "/other-resources",
            },
          ],
        },
      },
    ],
  },
  footer: {
    id: "Footer",
    components: [
      {
        id: "Footer",
        props: {
          agencyName: "Isomer Next",
          lastUpdated: "2024-01-28",
          items: [
            {
              title: "About Isomer",
              subItems: [
                {
                  title: "What is Isomer",
                  link: "http://yahoo.com",
                },
                {
                  title: "Why use Isomer",
                  link: "http://yahoo.com",
                },
                {
                  title: "Who uses Isomer",
                  link: "http://yahoo.com",
                },
              ],
              link: "http://google.com",
            },
            {
              title: "When to Use Isomer",
              subItems: [
                {
                  title: "What are the use cases for Isomer?",
                  link: "http://yahoo.com",
                },
                {
                  title: "What are static websites?",
                  link: "http://yahoo.com",
                },
                {
                  title: "Advance integrations",
                  link: "http://yahoo.com",
                },
              ],
              link: "http://google.com",
            },
            {
              title: "Getting Started",
              subItems: [
                {
                  title: "What to expect?",
                  link: "http://yahoo.com",
                },
                {
                  title: "Roles and Responsibilities",
                  link: "http://yahoo.com",
                },
                {
                  title: "FAQs",
                  link: "http://yahoo.com",
                },
              ],
              link: "http://google.com",
            },
            {
              title: "Other resources",
              subItems: [],
              link: "http://google.com",
            },
          ],
        },
      },
    ],
  },
  permalink: "/about-isomer/what-is-isomer/overview/",
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
            title: "what-is-isomer",
            paths: [
              {
                permalink: "/about-isomer/what-is-isomer/isomer-infra/",
                title: "Isomer's infrastructure",
                paths: [],
              },
              {
                permalink: "/about-isomer/what-is-isomer/isomer-template/",
                title: "The Isomer template",
                paths: [],
              },
              {
                permalink: "/about-isomer/what-is-isomer/isomercms/",
                title: "IsomerCMS",
                paths: [],
              },
              {
                permalink: "/about-isomer/what-is-isomer/overview/",
                title: "Overview",
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
    ],
  },
  children: <h1>Hello</h1>,
}
