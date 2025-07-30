import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { ContentpicProps } from "~/interfaces"
import { Contentpic } from "./Contentpic"

const meta: Meta<ContentpicProps> = {
  title: "Next/Components/Contentpic",
  component: Contentpic,
  argTypes: {},
  parameters: {
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
    chromatic: {
      ...withChromaticModes(["desktop", "tablet", "mobile"]),
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
      url: "https://www.isomer.gov.sg",
      logoUrl: "/isomer-logo.svg",
      navbar: { items: [] },
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
    imageAlt:
      "Two rhinos. A rhino is peacefully grazing on grass in a field in front of the other rhino.",
    imageSrc:
      "https://images.unsplash.com/photo-1527436826045-8805c615a6df?w=1280",

    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [
                {
                  type: "bold",
                },
              ],
              text: "Professor Rhino Bean",
            },
            { type: "hardBreak" },
            {
              type: "text",
              marks: [
                {
                  type: "bold",
                },
              ],
              text: "Executive Bean",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [],
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts. They inhabit parts of Africa and Asia and are primarily herbivores, feeding on grasses, leaves, and shoots. Despite their imposing size and strength, rhinos are endangered due to habitat loss and poaching. Conservation efforts are crucial to ensuring their survival.",
            },
          ],
        },
        {
          type: "unorderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                      text: "Impressive Size and Strength: ",
                    },
                    {
                      type: "text",
                      text: "Rhinos are among the largest land mammals, with powerful builds that make them formidable in the wild.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                      text: "Unique Horns: ",
                    },
                    {
                      type: "text",
                      text: "Their distinctive horns are not only a symbol of their strength but also serve important roles in defense and foraging.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                      text: "Ancient Survivors: ",
                    },
                    {
                      type: "text",
                      text: "Rhinos have been around for millions of years, representing a living link to prehistoric times.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                      text: "Ecological Impact: ",
                    },
                    {
                      type: "text",
                      text: "Rhinos play a key role in their ecosystems by helping to maintain the balance of vegetation and supporting other wildlife.",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [],
              text: "<a href='https://www.traffic.org/news/singapore-rhino-horn-smuggler-24/'>Singapore court gets tough on rhino horn smuggler</a>",
            },
          ],
        },
      ],
    },
  },
}
export default meta
type Story = StoryObj<typeof Contentpic>

// Default scenario
export const Default: Story = {}

export const ShortParagraph: Story = {
  args: {
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              text: "This is a short paragraph",
              type: "text",
            },
          ],
        },
      ],
    },
  },
}
