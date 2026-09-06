/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-deprecated -- story/test fixtures use narrowed mock shapes */
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CollectionPageSchemaType, IsomerSitemap } from "~/types"
import { flatten, times } from "lodash-es"
import { expect, userEvent, within } from "storybook/test"
import { generateSiteConfig } from "~/stories/helpers"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { withChromaticModes } from "@isomer/storybook-config"

import { CollectionLayout } from "./Collection"

const COLLECTION_ITEMS: IsomerSitemap[] = flatten(
  times(10, (index) => [
    {
      category: "Category Name",
      date: "07/05/2024",
      id: `${index}`,
      lastModified: "",
      layout: "article",
      permalink: `/publications/item-one-${index}`,
      summary:
        "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the months. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the months.",
      title: `This is a publication title that is really long because ${index}`,
    },
    {
      category: "Category Name",
      date: "07/05/2024",
      fileDetails: { size: "1.2MB", type: "png" },
      id: `${index}`,
      image: {
        alt: "placeholder",
        src: "https://images.unsplash.com/photo-1728931710331-7f74dca643eb?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      lastModified: "",
      layout: "file",
      permalink: `/publications/item-two-${index}`,
      ref: "https://www.isomer.gov.sg/images/Homepage/hero%20banner_10.png",
      summary:
        "This is supposed to be a description of the hero banner that Isomer uses on their official website.",
      title: `This is the title for a collection item that shows the Isomer hero banner-${index}`,
    },
    {
      category: "Category Name",
      date: "12/08/2023",
      id: `${index}`,
      lastModified: "",
      layout: "link",
      permalink: `/publications/item-three-${index}`,
      ref: "https://guide.isomer.gov.sg",
      summary:
        "Have a look at the Isomer guide to understand how to use the Isomer CMS.",
      title: `Isomer guide-${index}`,
    },
  ]),
)

const generateArgs = ({
  collectionItems = COLLECTION_ITEMS,
  variant = "collection",
  tagCategories,
}: {
  collectionItems?: IsomerSitemap[]
  variant?: CollectionPageSchemaType["page"]["variant"]
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"]
} = {}): CollectionPageSchemaType => ({
  content: [],
  layout: "collection",
  meta: {
    description: "A Next.js starter for Isomer",
  },
  page: {
    lastModified: "2024-05-02T14:12:57.160Z",
    permalink: "/publications",
    subtitle:
      "Since this page type supports text-heavy articles that are primarily for reading and absorbing information, the max content width on desktop is kept even smaller than its General Content Page counterpart.",
    tagCategories,
    title: "Publications and other press releases",
    variant,
  },
  site: generateSiteConfig({
    siteMap: {
      children: [
        {
          children: collectionItems,
          id: "2",
          lastModified: "",
          layout: "collection",
          permalink: "/publications",
          summary: "",
          title: "Publications and other press releases",
        },
      ],
      id: "1",
      lastModified: "",
      layout: "homepage",
      permalink: "/",
      summary: "",
      title: "Home",
    },
    siteName: "Isomer Next",
  }),
})

const meta: Meta<CollectionPageSchemaType> = {
  argTypes: {},
  component: CollectionLayout,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Layouts/Collection",
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
    await userEvent.click(screen.getByText(/2023 \(10\)/iu))
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
      name: /Start typing to search/iu,
    })
    await userEvent.type(searchElem, "anything")
  },
}

export const NoResults: Story = {
  args: generateArgs(),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchElem = screen.getByRole("searchbox", {
      name: /Start typing to search/iu,
    })
    await userEvent.type(searchElem, "some whacky search term")
  },
}

// Category is now an ordinary tagCategories group — an item is tagged with
// an option UUID rather than carrying a plain `category` string.
const CATEGORY_NAME_2_OPTION_ID = "category-name-2"
const CATEGORY_TAG_CATEGORY: NonNullable<
  CollectionPageSchemaType["page"]["tagCategories"]
> = [
  {
    display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
    id: "category-group",
    isRequired: true,
    label: "Category",
    options: [{ id: CATEGORY_NAME_2_OPTION_ID, label: "Category Name 2" }],
  },
]

export const FilteredEmptyResults: Story = {
  args: generateArgs({
    collectionItems: [
      ...COLLECTION_ITEMS,
      {
        date: "2025-05-07",
        fileDetails: {
          size: "1.2MB",
          type: "png",
        },
        id: "2025",
        lastModified: "",
        layout: "file",
        permalink: `/publications/item-twenty-twenty-five`,
        ref: "https://www.isomer.gov.sg/images/Homepage/hero%20banner_10.png",
        summary:
          "This is supposed to be a description of the hero banner that Isomer uses on their official website.",
        tagged: [CATEGORY_NAME_2_OPTION_ID],
        title: `2025 File`,
      },
    ],
    tagCategories: CATEGORY_TAG_CATEGORY,
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/2024 \(20\)/iu))
    await userEvent.click(screen.getByText(/Category Name 2 \(1\)/iu))
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
    const dateNotSpecified = screen.queryByText(/Not specified \(3\)/iu)
    await expect(dateNotSpecified).toBeInTheDocument()

    const dateText = await screen.findAllByText(/7 May 2024/u)
    await expect(dateText.length).toBe(10)
  },
}

export const YearFilterSelectNotSpecified: Story = {
  args: generateArgs({ collectionItems: threeItemsHaveUndefinedDate }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/Not specified/iu))

    const resultsHeader = await screen.findAllByText(/3 items/u)
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

    const yearFilter = screen.queryByText(/Year/iu)
    await expect(yearFilter).not.toBeInTheDocument()

    const lastWordOccurences = await screen.findAllByText(/Isomer guide-/u)
    await expect(lastWordOccurences.length).toBe(10)
  },
}

const THE_ONLY_CATEGORY_OPTION_ID = "the-only-category"

export const AllResultsSameCategory: Story = {
  args: generateArgs({
    collectionItems: COLLECTION_ITEMS.map((item) => ({
      ...item,
      tagged: [THE_ONLY_CATEGORY_OPTION_ID],
    })),
    tagCategories: [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        id: "category-group",
        isRequired: true,
        label: "Category",
        options: [
          { id: THE_ONLY_CATEGORY_OPTION_ID, label: "The only category" },
        ],
      },
    ],
  }),
  name: "Should show category filter even if all items have same category",
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const categoryFilter = screen.queryByText(/Category/u)
    await expect(categoryFilter).toBeInTheDocument()

    const categoryItems = await screen.findAllByText(
      /The only category \(30\)/u,
    )
    await expect(categoryItems.length).toBe(1)
  },
}

export const AllResultsSameYear: Story = {
  args: generateArgs({
    collectionItems: COLLECTION_ITEMS.map((item) => ({
      ...item,
      date: "2026-05-07",
    })),
  }),
  name: "Should show year filter if all items have same year",
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const yearFilter = screen.queryByText(/Year/iu)
    await expect(yearFilter).toBeInTheDocument()
  },
}

const itemsWithNoFilterableAttributes = COLLECTION_ITEMS.map((item) => ({
  ...item,
  date: undefined,
  tags: undefined,
}))

export const NoFiltersCollectionCard: Story = {
  args: generateArgs({
    collectionItems: itemsWithNoFilterableAttributes,
    variant: "collection",
  }),
  name: "No Filters (Collection Card)",
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)

    const yearFilter = screen.queryByText(/Year/iu)
    await expect(yearFilter).not.toBeInTheDocument()

    const filtersHeading = screen.queryByRole("heading", { name: /Filters/iu })
    await expect(filtersHeading).not.toBeInTheDocument()
  },
}

export const NoFiltersBlogCard: Story = {
  args: generateArgs({
    collectionItems: itemsWithNoFilterableAttributes,
    variant: "blog",
  }),
  name: "No Filters (Blog Card)",
  play: NoFiltersCollectionCard.play,
}

export const FileCard: Story = {
  args: generateArgs({
    // SAFETY: Story fixture provides a partial sitemap item for collection stories.
    collectionItems: [COLLECTION_ITEMS[1]] as IsomerSitemap[],
  }),
}

export const FileCardNoImage: Story = {
  args: generateArgs({
    collectionItems: [
      // SAFETY: Story fixture provides a partial sitemap item for collection stories.
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
