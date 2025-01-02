import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"
import flatten from "lodash/flatten"
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
        "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the months. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the months.",
      date: "07/05/2024",
      category: "Category Name",
      tags: [{ category: "jokes", values: ["Dad"], selected: ["Dad"] }],
    },
    {
      id: `${index}`,
      title: `This is the title for a collection item that shows the Isomer hero banner-${index}`,
      permalink: `/publications/item-two-${index}`,
      lastModified: "",
      layout: "file",
      image: {
        src: "https://images.unsplash.com/photo-1728931710331-7f74dca643eb?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        alt: "placeholder",
      },
      summary:
        "This is supposed to be a description of the hero banner that Isomer uses on their official website.",
      date: "07/05/2024",
      category: "Category Name",
      ref: "https://www.isomer.gov.sg/images/Homepage/hero%20banner_10.png",
      fileDetails: {
        type: "png",
        size: "1.2MB",
      },
      tags: [{ category: "jokes", values: ["Lame"], selected: ["Lame"] }],
    },
    {
      id: `${index}`,
      title: `Isomer guide-${index}`,
      permalink: `/publications/item-three-${index}`,
      lastModified: "",
      layout: "link",
      summary:
        "Have a look at the Isomer guide to understand how to use the Isomer CMS.",
      date: "12/08/2023",
      category: "Category Name",
      ref: "https://guide.isomer.gov.sg",
      tags: [
        {
          category: "jokes",
          values: [
            "This is a very long tag that should be reflowed on smaller screens maybe",
          ],
          selected: [
            "Lame",
            "This is a very long tag that shuold be reflowed on smaller screens maybe",
            "This is a second long link that should eat into the image area so that we can see how it looks",
          ],
        },
      ],
    },
  ]),
)

const generateArgs = ({
  collectionItems = COLLECTION_ITEMS,
  variant = "collection",
}: {
  collectionItems?: IsomerSitemap[]
  variant?: CollectionPageSchemaType["page"]["variant"]
} = {}): CollectionPageSchemaType => {
  return {
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
            children: collectionItems,
            tags: [
              { category: "tag", selected: ["A tag"] },
              { category: "tagged", selected: ["tagged"] },
              {
                category: "long",
                selected: [
                  "This is a very long tag that shuold be reflowed on smaller screens maybe",
                ],
              },
              {
                category: "very long",
                selected: [
                  "This is a second long link that should eat into the image area so that we can see how it looks",
                ],
              },
            ],
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
      notification: {
        content: [{ type: "text", text: "This is a short notification" }],
      },
    },
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      title: "Publications and other press releases",
      permalink: "/publications",
      lastModified: "2024-05-02T14:12:57.160Z",
      subtitle:
        "Since this page type supports text-heavy articles that are primarily for reading and absorbing information, the max content width on desktop is kept even smaller than its General Content Page counterpart.",
      variant,
    },
    content: [],
  }
}

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
}
export default meta
type Story = StoryObj<typeof CollectionLayout>

export const Default: Story = {
  args: generateArgs(),
  name: "Collection",
}

export const WithFilters: Story = {
  args: generateArgs(),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/2023 \(10\)/i))
  },
}

const emptyCollectionItems: IsomerSitemap[] = []

export const EmptyCollection: Story = {
  args: generateArgs({ collectionItems: emptyCollectionItems }),
}

export const SearchingEmptyCollection: Story = {
  args: generateArgs({ collectionItems: emptyCollectionItems }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchElem = screen.getByRole("searchbox", {
      name: /Start typing to search/i,
    })
    await userEvent.type(searchElem, "anything")
  },
}

export const NoResults: Story = {
  args: generateArgs(),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchElem = screen.getByRole("searchbox", {
      name: /Start typing to search/i,
    })
    await userEvent.type(searchElem, "some whacky search term")
  },
}

export const FilteredEmptyResults: Story = {
  args: generateArgs({
    collectionItems: [
      ...COLLECTION_ITEMS,
      {
        id: "2025",
        title: `2025 File`,
        permalink: `/publications/item-twenty-twenty-five`,
        lastModified: "",
        layout: "file",
        summary:
          "This is supposed to be a description of the hero banner that Isomer uses on their official website.",
        date: "2025-05-07",
        category: "Category Name 2",
        ref: "https://www.isomer.gov.sg/images/Homepage/hero%20banner_10.png",
        fileDetails: {
          type: "png",
          size: "1.2MB",
        },
      },
    ],
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/2024 \(20\)/i))
    await userEvent.click(screen.getByText(/Category Name 2 \(1\)/i))
  },
}

const threeItemsHaveUndefinedDate = [
  ...COLLECTION_ITEMS.slice(0, 3).map((item) => ({
    ...item,
    date: undefined,
  })),
  ...COLLECTION_ITEMS.slice(3),
]

export const YearFilter: Story = {
  args: generateArgs({ collectionItems: threeItemsHaveUndefinedDate }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const dateNotSpecified = screen.queryByText(/Not specified \(3\)/i)
    await expect(dateNotSpecified).toBeInTheDocument()

    const dateText = await screen.findAllByText(/7 May 2024/)
    await expect(dateText.length).toBe(10)
  },
}

export const YearFilterSelectNotSpecified: Story = {
  args: generateArgs({ collectionItems: threeItemsHaveUndefinedDate }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/Not specified/i))

    const resultsHeader = await screen.findAllByText(/3 articles/)
    await expect(resultsHeader.length).toBe(1)
  },
}

const allItemsHaveUndefinedDate = COLLECTION_ITEMS.map((item) => ({
  ...item,
  date: undefined,
}))

export const AllResultsNoDate: Story = {
  args: generateArgs({ collectionItems: allItemsHaveUndefinedDate }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)

    const yearFilter = screen.queryByText(/Year/i)
    await expect(yearFilter).not.toBeInTheDocument()

    const lastWordOccurences = await screen.findAllByText(/Isomer guide-/)
    await expect(lastWordOccurences.length).toBe(10)
  },
}

export const AllResultsSameCategory: Story = {
  name: "Should not show category filter if all items have same category",
  args: generateArgs({
    collectionItems: COLLECTION_ITEMS.map((item) => ({
      ...item,
      category: "The only categ0ry",
    })),
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const categoryFilter = screen.queryByText(/Category/i)
    await expect(categoryFilter).not.toBeInTheDocument()
  },
}

export const AllResultsSameYear: Story = {
  name: "Should not show year filter if all items have same year",
  args: generateArgs({
    collectionItems: COLLECTION_ITEMS.map((item) => ({
      ...item,
      date: "2026-05-07",
    })),
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const yearFilter = screen.queryByText(/Year/i)
    await expect(yearFilter).not.toBeInTheDocument()
  },
}

export const FileCard: Story = {
  args: generateArgs({
    collectionItems: [COLLECTION_ITEMS[1]] as IsomerSitemap[],
  }),
}

export const FileCardNoImage: Story = {
  args: generateArgs({
    collectionItems: [
      { ...COLLECTION_ITEMS[1], image: undefined } as IsomerSitemap,
    ],
  }),
}

export const Blog: Story = {
  args: generateArgs({
    collectionItems: COLLECTION_ITEMS,
    variant: "blog",
  }),
}
