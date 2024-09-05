import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import flatten from "lodash/flatten"
import merge from "lodash/merge"
import times from "lodash/times"

import { withChromaticModes } from "@isomer/storybook-config"

import type { IsomerSitemap } from "~/engine"
import { type CollectionPageSchemaType } from "~/engine"
import CollectionLayout from "./Collection"

const COLLECTION_ITEMS: IsomerSitemap[] = flatten(
  times(10, (index) => [
    {
      id: `${index}`,
      title: `This is a publication title that is really long because ${index}`,
      permalink: `/publications/item-one-${index}`,
      lastModified: "",
      layout: "article",
      summary:
        "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
      date: "2024-05-07",
      category: "Category Name",
    },
    {
      id: `${index}`,
      title: `Isomer hero banner-${index}`,
      permalink: `/publications/item-two-${index}`,
      lastModified: "",
      layout: "file",
      summary:
        "This is supposed to be a description of the hero banner that Isomer uses on their official website.",
      date: "2024-05-07",
      category: "Category Name",
      ref: "https://www.isomer.gov.sg/images/Homepage/hero%20banner_10.png",
      fileDetails: {
        type: "png",
        size: "1.2MB",
      },
    },
    {
      id: `${index}`,
      title: `Isomer guide-${index}`,
      permalink: `/publications/item-three-${index}`,
      lastModified: "",
      layout: "link",
      summary:
        "Have a look at the Isomer guide to understand how to use the Isomer CMS.",
      date: "2023-08-12",
      category: "Category Name",
      ref: "https://guide.isomer.gov.sg",
    },
  ]),
)

const meta: Meta<CollectionPageSchemaType> = {
  title: "Next/Layouts/Collection",
  component: CollectionLayout,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    layout: "collection",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Publications and other press releases",
            permalink: "/publications",
            lastModified: "",
            layout: "collection",
            summary: "",
            children: COLLECTION_ITEMS,
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      navBarItems: [
        {
          name: "About us",
          url: "/item-one",
          items: [
            {
              name: "PA's network one",
              url: "/item-one/pa-network-one",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              name: "PA's network two",
              url: "/item-one/pa-network-two",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              name: "PA's network three",
              url: "/item-one/pa-network-three",
            },
            {
              name: "PA's network four",
              url: "/item-one/pa-network-four",
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
            },
            {
              name: "PA's network five",
              url: "/item-one/pa-network-five",
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
            },
            {
              name: "PA's network six",
              url: "/item-one/pa-network-six",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
          ],
        },
        {
          name: "Industries",
          url: "/item-two",
          description: "This is a description of the item.",
          items: [
            {
              name: "A sub item",
              url: "/item-two/sub-item",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              name: "Another sub item",
              url: "/item-two/another-sub-item",
            },
          ],
        },
        {
          name: "Media",
          url: "/item-three",
          items: [
            {
              name: "A sub item",
              url: "/item-three/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-three/another-sub-item",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
          ],
        },
        {
          name: "Careers",
          url: "/item-four",
          items: [
            {
              name: "A sub item",
              url: "/item-four/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-four/another-sub-item",
            },
          ],
        },
        {
          name: "Publications",
          url: "/item-five",
          items: [
            {
              name: "A sub item",
              url: "/item-five/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-five/another-sub-item",
            },
          ],
        },
        {
          name: "Newsroom",
          url: "/item-six",
          items: [
            {
              name: "A sub item",
              url: "/item-six/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-six/another-sub-item",
            },
          ],
        },
        {
          name: "Contact us",
          url: "/single-item",
        },
      ],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
      notification: "This is a notification",
    },
    page: {
      title: "Publications and other press releases",
      description: "A Next.js starter for Isomer",
      permalink: "/publications",
      lastModified: "2024-05-02T14:12:57.160Z",
      subtitle:
        "Since this page type supports text-heavy articles that are primarily for reading and absorbing information, the max content width on desktop is kept even smaller than its General Content Page counterpart.",
    },
  },
}
export default meta
type Story = StoryObj<typeof CollectionLayout>

export const Default: Story = {
  name: "Collection",
}

export const WithFilters: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/2023 \(10\)/i))
  },
}

export const EmptyCollection: Story = {
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
        children: [
          {
            id: "2",
            title: "Publications and other press releases",
            permalink: "/publications",
            lastModified: "",
            layout: "collection",
            summary: "",
            children: [],
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      navBarItems: [
        {
          name: "About us",
          url: "/item-one",
          items: [
            {
              name: "PA's network one",
              url: "/item-one/pa-network-one",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              name: "PA's network two",
              url: "/item-one/pa-network-two",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              name: "PA's network three",
              url: "/item-one/pa-network-three",
            },
            {
              name: "PA's network four",
              url: "/item-one/pa-network-four",
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
            },
            {
              name: "PA's network five",
              url: "/item-one/pa-network-five",
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
            },
            {
              name: "PA's network six",
              url: "/item-one/pa-network-six",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
          ],
        },
        {
          name: "Industries",
          url: "/item-two",
          description: "This is a description of the item.",
          items: [
            {
              name: "A sub item",
              url: "/item-two/sub-item",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              name: "Another sub item",
              url: "/item-two/another-sub-item",
            },
          ],
        },
        {
          name: "Media",
          url: "/item-three",
          items: [
            {
              name: "A sub item",
              url: "/item-three/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-three/another-sub-item",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
          ],
        },
        {
          name: "Careers",
          url: "/item-four",
          items: [
            {
              name: "A sub item",
              url: "/item-four/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-four/another-sub-item",
            },
          ],
        },
        {
          name: "Publications",
          url: "/item-five",
          items: [
            {
              name: "A sub item",
              url: "/item-five/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-five/another-sub-item",
            },
          ],
        },
        {
          name: "Newsroom",
          url: "/item-six",
          items: [
            {
              name: "A sub item",
              url: "/item-six/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-six/another-sub-item",
            },
          ],
        },
        {
          name: "Contact us",
          url: "/single-item",
        },
      ],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
      notification: "This is a notification",
    },
  },
}

export const SearchingEmptyCollection: Story = {
  args: EmptyCollection.args,
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchElem = screen.getByRole("searchbox", {
      name: /search for publications and other press releases/i,
    })
    await userEvent.type(searchElem, "anything")
  },
}

export const NoResults: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchElem = screen.getByRole("searchbox", {
      name: /search for publications and other press releases/i,
    })
    await userEvent.type(searchElem, "some whacky search term")
  },
}

export const FilteredEmptyResults: Story = {
  args: merge(meta.args, {
    site: {
      siteMap: {
        children: [
          {
            children: [
              {
                title: `2025 File`,
                permalink: `/publications/item-twenty-twenty-five`,
                lastModified: "",
                layout: "file",
                summary:
                  "This is supposed to be a description of the hero banner that Isomer uses on their official website.",
                date: "2025-05-07",
                category: "Category Name",
                ref: "https://www.isomer.gov.sg/images/Homepage/hero%20banner_10.png",
                fileDetails: {
                  type: "png",
                  size: "1.2MB",
                },
              },
            ],
          },
        ],
      },
    },
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/2025 \(1\)/i))
    await userEvent.click(screen.getByText(/Link \(10\)/i))
  },
}
