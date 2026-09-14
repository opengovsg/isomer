import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CollectionPageSchemaType, IsomerSitemap } from "~/types"
import { addDays, format } from "date-fns"
import { flatten, times } from "lodash-es"
import { expect, fireEvent, userEvent, within } from "storybook/test"
import { generateSiteConfig } from "~/stories/helpers"
import {
  DATE_FILTER_STATUS,
  DEFAULT_DATE_FILTER_STATUS_LABELS,
  TAG_CATEGORY_DISPLAY_OPTIONS,
  TAG_CATEGORY_TYPE,
} from "~/types/constants"

import { withChromaticModes } from "@isomer/storybook-config"

import { CollectionLayout } from "./Collection"

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
      fileDetails: { type: "png", size: "1.2MB" },
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
} = {}): CollectionPageSchemaType => {
  return {
    layout: "collection",
    site: generateSiteConfig({
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
          },
        ],
      },
    }),
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
      tagCategories,
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

// Category is now an ordinary tagCategories group — an item is tagged with
// an option UUID rather than carrying a plain `category` string.
const CATEGORY_NAME_2_OPTION_ID = "category-name-2"
const CATEGORY_TAG_CATEGORY: NonNullable<
  CollectionPageSchemaType["page"]["tagCategories"]
> = [
  {
    label: "Category",
    id: "category-group",
    isRequired: true,
    display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
    options: [{ label: "Category Name 2", id: CATEGORY_NAME_2_OPTION_ID }],
  },
]

export const FilteredEmptyResults: Story = {
  args: generateArgs({
    tagCategories: CATEGORY_TAG_CATEGORY,
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
        tagged: [CATEGORY_NAME_2_OPTION_ID],
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

    // CollectionCard renders the publication date twice (desktop sidebar + mobile
    // inline); both nodes stay in the DOM, so 10 paginated cards → 20 matches.
    const dateText = await screen.findAllByText(/7 May 2024/)
    await expect(dateText.length).toBe(20)
  },
}

export const YearFilterSelectNotSpecified: Story = {
  args: generateArgs({ collectionItems: threeItemsHaveUndefinedDate }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/Not specified/i))

    const resultsHeader = await screen.findAllByText(/3 items/)
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

const THE_ONLY_CATEGORY_OPTION_ID = "the-only-category"

export const AllResultsSameCategory: Story = {
  name: "Should show category filter even if all items have same category",
  args: generateArgs({
    tagCategories: [
      {
        label: "Category",
        id: "category-group",
        isRequired: true,
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        options: [
          { label: "The only category", id: THE_ONLY_CATEGORY_OPTION_ID },
        ],
      },
    ],
    collectionItems: COLLECTION_ITEMS.map((item) => ({
      ...item,
      tagged: [THE_ONLY_CATEGORY_OPTION_ID],
    })),
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const categoryFilter = screen.queryByText(/Category/)
    await expect(categoryFilter).toBeInTheDocument()

    const categoryItems = await screen.findAllByText(/The only category \(30\)/)
    await expect(categoryItems.length).toBe(1)
  },
}

export const AllResultsSameYear: Story = {
  name: "Should show year filter if all items have same year",
  args: generateArgs({
    collectionItems: COLLECTION_ITEMS.map((item) => ({
      ...item,
      date: "2026-05-07",
    })),
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const yearFilter = screen.queryByText(/Year/i)
    await expect(yearFilter).toBeInTheDocument()
  },
}

const itemsWithNoFilterableAttributes = COLLECTION_ITEMS.map((item) => ({
  ...item,
  date: undefined,
  tags: undefined,
}))

export const NoFiltersCollectionCard: Story = {
  name: "No Filters (Collection Card)",
  args: generateArgs({
    collectionItems: itemsWithNoFilterableAttributes,
    variant: "collection",
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)

    const yearFilter = screen.queryByText(/Year/i)
    await expect(yearFilter).not.toBeInTheDocument()

    const filtersHeading = screen.queryByRole("heading", { name: /Filters/i })
    await expect(filtersHeading).not.toBeInTheDocument()
  },
}

export const NoFiltersBlogCard: Story = {
  name: "No Filters (Blog Card)",
  args: generateArgs({
    collectionItems: itemsWithNoFilterableAttributes,
    variant: "blog",
  }),
  play: NoFiltersCollectionCard.play,
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

// Anchored to the same fixed reference date `.storybook/preview.tsx`'s
// `MockDateDecorator` freezes `Date` to for every story (deterministic
// Chromatic snapshots) — NOT real wall-clock `new Date()`. The decorator's
// `mockdate.set(...)` only takes effect once the story actually renders, by
// which point this module has already finished evaluating, so anchoring to
// real time here would compute dates relative to a "today" the app never
// actually sees, landing every item in the same bucket regardless of intent.
const STORYBOOK_MOCKED_DATE = "2025-08-09T12:00:00.000Z"
const offsetDate = (days: number): string =>
  format(addDays(new Date(STORYBOOK_MOCKED_DATE), days), "yyyy-MM-dd")

const EVENT_DATE_FILTER_ID = "event-date-filter"
// Matches the Figma reference's exact bucket labels ("Ended", not the
// schema default "Event ended").
const EVENT_DATE_STATUS_LABELS = {
  ...DEFAULT_DATE_FILTER_STATUS_LABELS,
  [DATE_FILTER_STATUS.Ended.id]: "Ended",
}
const EVENT_DATE_TAG_CATEGORY: NonNullable<
  CollectionPageSchemaType["page"]["tagCategories"]
> = [
  {
    label: "Event date",
    id: EVENT_DATE_FILTER_ID,
    type: TAG_CATEGORY_TYPE.Date,
    statusLabels: EVENT_DATE_STATUS_LABELS,
  },
]

// Counts (12 upcoming / 10 ongoing / 2 ended) mirror the Figma reference
// for the sidebar's date-filter section (see wayfinder ticket 009).
const dateFilterCollectionItem = (
  index: number,
  dateTagged: NonNullable<IsomerSitemap["dateTagged"]>,
): IsomerSitemap => ({
  id: `date-filter-item-${index}`,
  title: `Annual Community Charity Run ${2020 + index}`,
  permalink: `/publications/annual-community-charity-run-${index}`,
  lastModified: "",
  layout: "article",
  summary:
    "Join us for a day of community, fitness, and fundraising for a good cause.",
  dateTagged,
})

const DATE_FILTER_COLLECTION_ITEMS: IsomerSitemap[] = [
  ...times(12, (index) =>
    dateFilterCollectionItem(index, [
      {
        id: EVENT_DATE_FILTER_ID,
        date: offsetDate(30 + index),
        endDate: offsetDate(32 + index),
      },
    ]),
  ),
  ...times(10, (index) =>
    dateFilterCollectionItem(12 + index, [
      {
        id: EVENT_DATE_FILTER_ID,
        date: offsetDate(-5),
        endDate: offsetDate(5),
      },
    ]),
  ),
  ...times(2, (index) =>
    dateFilterCollectionItem(22 + index, [
      {
        id: EVENT_DATE_FILTER_ID,
        date: offsetDate(-60),
        endDate: offsetDate(-50),
      },
    ]),
  ),
]

export const DateFilters: Story = {
  name: "Date Filters",
  args: generateArgs({
    tagCategories: EVENT_DATE_TAG_CATEGORY,
    collectionItems: DATE_FILTER_COLLECTION_ITEMS,
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)

    await expect(screen.getByText(/Upcoming \(12\)/i)).toBeInTheDocument()
    await expect(screen.getByText(/Ongoing \(10\)/i)).toBeInTheDocument()
    await expect(screen.getByText(/Ended \(2\)/i)).toBeInTheDocument()
  },
}

export const DateFiltersStatusFiltered: Story = {
  name: "Date Filters — Status Filtered",
  args: generateArgs({
    tagCategories: EVENT_DATE_TAG_CATEGORY,
    collectionItems: DATE_FILTER_COLLECTION_ITEMS,
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/Ended \(2\)/i))

    const resultsHeader = await screen.findAllByText(/2 items/)
    await expect(resultsHeader.length).toBe(1)
  },
}

// Date-range stories are exclusively about the date inputs — no status
// checkbox (Upcoming/Ongoing/Ended) should ever end up checked, since
// `updateAppliedDateRange` applies a range independently of `items`.
const expectNoStatusChecked = async (canvasElement: HTMLElement) => {
  const checkedBoxes = canvasElement.querySelectorAll(
    'input[type="checkbox"]:checked',
  )
  await expect(checkedBoxes.length).toBe(0)
}

const fillDateRange = async (
  canvasElement: HTMLElement,
  start: string,
  end: string,
) => {
  const screen = within(canvasElement)
  await fireEvent.change(screen.getByLabelText("From"), {
    target: { value: start },
  })
  await fireEvent.change(screen.getByLabelText("To"), {
    target: { value: end },
  })
}

export const DateFiltersDateFiltered: Story = {
  name: "Date Filters — Date Filtered",
  args: generateArgs({
    tagCategories: EVENT_DATE_TAG_CATEGORY,
    collectionItems: DATE_FILTER_COLLECTION_ITEMS,
  }),
  play: async ({ canvasElement }) => {
    // 4 and 14 August 2025 — the exact range the "ongoing" items above use
    // (offsetDate(-5)/offsetDate(5) from the mocked "today" of 9 Aug 2025).
    await fillDateRange(canvasElement, "2025-08-04", "2025-08-14")

    const screen = within(canvasElement)
    const resultsHeader = await screen.findAllByText(/10 items/)
    await expect(resultsHeader.length).toBe(1)

    await expectNoStatusChecked(canvasElement)
  },
}

export const DateFiltersBothFiltered: Story = {
  name: "Date Filters — Both Filtered",
  args: generateArgs({
    tagCategories: EVENT_DATE_TAG_CATEGORY,
    collectionItems: DATE_FILTER_COLLECTION_ITEMS,
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    await userEvent.click(screen.getByText(/Upcoming \(12\)/i))

    // Wide enough to include all 10 ongoing (4–14 Aug) plus the first three
    // upcoming (8–10 / 9–11 / 10–12 Sep). Upcoming alone is 12; this range
    // alone is 13; AND'd together only those three upcoming items remain.
    await fillDateRange(canvasElement, "2025-08-04", "2025-09-10")

    const resultsHeader = await screen.findAllByText(/3 items/)
    await expect(resultsHeader.length).toBe(1)
  },
}
