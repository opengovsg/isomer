import type { Meta, StoryObj } from "@storybook/react"

import Paragraph from "./Paragraph"

const meta: Meta<typeof Paragraph> = {
  title: "Next/Components/Paragraph",
  component: Paragraph,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "searchSG",
        clientId: "",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Paragraph>

export const Default: Story = {
  args: {
    content: [
      {
        type: "text",
        text: "This is a paragraph of text. It can contain ",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              target: "_blank",
            },
          },
        ],
        text: "external links",
      },
      {
        type: "text",
        text: " (and ",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "/contact",
              target: "_blank",
            },
          },
        ],
        text: "internal ones",
      },
      {
        type: "text",
        text: "), ",
      },
      {
        type: "text",
        marks: [
          {
            type: "code",
          },
        ],
        text: "code",
      },
      {
        type: "text",
        text: ", and line breaks. We can also use ",
      },
      {
        type: "text",
        marks: [
          {
            type: "subscript",
          },
        ],
        text: "subscript",
      },
      {
        type: "text",
        text: " and ",
      },
      {
        type: "text",
        marks: [
          {
            type: "superscript",
          },
        ],
        text: "superscript",
      },
      {
        type: "text",
        text: " text.",
      },
    ],
  },
}

export const Simple: Story = {
  args: {
    content: [
      {
        type: "text",
        text: "This is a simple paragraph",
      },
    ],
  },
}

export const Combined: Story = {
  args: {
    content: [
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
          },
        ],
        text: "Create customised ",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
          },
          {
            type: "superscript",
          },
          {
            type: "italic",
          },
        ],
        text: "business",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
          },
          {
            type: "italic",
          },
        ],
        text: "custom",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
          },
        ],
        text: " solutions for growth",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google2.com",
              target: "_blank",
            },
          },
        ],
        text: " Another link",
      },
    ],
  },
}
