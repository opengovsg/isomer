import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CollectionCardProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"
import { expect, within } from "storybook/test"
import { isDateFilter } from "~/types/page"

import { withChromaticModes } from "@isomer/storybook-config"

import { CollectionCard } from "./CollectionCard"

const DATE_FILTER_TAG_CATEGORIES: CollectionPagePageProps["tagCategories"] = [
  {
    id: "event-date",
    label: "Event Date",
    type: "date",
    statusLabels: [
      { id: "ENDED", label: "Event ended" },
      { id: "ONGOING", label: "Ongoing" },
      { id: "UPCOMING", label: "Upcoming" },
    ],
  },
  {
    id: "registration-deadline",
    label: "Registration Deadline",
    type: "date",
    statusLabels: [
      { id: "ENDED", label: "Registration closed" },
      { id: "ONGOING", label: "Registration open" },
      { id: "UPCOMING", label: "Registration upcoming" },
    ],
  },
]

const statusLabelsFor = (categoryId: string) => {
  const category = DATE_FILTER_TAG_CATEGORIES?.find(
    (entry) => entry.id === categoryId,
  )
  return category && isDateFilter(category) ? category.statusLabels : []
}

const pad = (n: number): string => n.toString().padStart(2, "0")
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const meta: Meta<typeof CollectionCard> = {
  title: "Next/Internal Components/CollectionCard",
  component: CollectionCard,
  argTypes: {},
  parameters: {
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
    chromatic: withChromaticModes(["desktop", "mobile"]),
  },
}
export default meta
type Story = StoryObj<typeof CollectionCard>

const generateArgs = ({
  shouldShowDate = true,
  isExternalLink = false,
  ...overrides
}: Partial<CollectionCardProps> & {
  isExternalLink?: boolean
  shouldShowDate?: boolean
}): Partial<CollectionCardProps> & {
  shouldShowDate?: boolean
} => {
  return {
    date: new Date("2023-12-02"),
    plaintextTags: [{ category: "Category", selected: ["Research"] }],
    title:
      "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
    description:
      "We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year. We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year.",
    image: {
      src: "https://placehold.co/500x500",
      alt: "placeholder",
    },
    referenceLinkHref: isExternalLink ? "https://www.google.com" : "/",
    imageSrc: "https://placehold.co/500x500",
    itemTitle:
      "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
    shouldShowDate,
    pillTags: [],
    ...overrides,
  }
}

export const Default: Story = {
  args: generateArgs({}),
}

export const Hover: Story = {
  args: generateArgs({}),
  parameters: {
    pseudo: {
      hover: [".group", "img"],
    },
  },
}

export const ExternalLink: Story = {
  args: generateArgs({
    isExternalLink: true,
    title: "This is a not-so-long title that will be truncated",
  }),
}

// TODO: ideally when the text is being truncated,
// the external link icon should be at the end of the text instead of the newline
export const ExternalLinkLongText: Story = {
  args: generateArgs({ isExternalLink: true }),
}

export const UndefinedDate: Story = {
  args: generateArgs({ date: undefined }),
}

export const HideDate: Story = {
  args: generateArgs({
    shouldShowDate: false,
    date: undefined,
  }),
}

export const CardWithoutImage: Story = {
  args: generateArgs({ image: undefined }),
}

export const CardWithoutPlaintextTags: Story = {
  args: generateArgs({ plaintextTags: [] }),
}

export const ShortDescription: Story = {
  args: generateArgs({
    title: "Short title",
    description: "Short description",
  }),
}

export const DescriptionWithOnlyWhitespace: Story = {
  args: generateArgs({
    title: "Short title",
    description: "   ",
  }),
}

export const TagsWithImage: Story = {
  args: generateArgs({
    title: "Collection card with tags",
    description: "This is a random description that will be on the card",
    pillTags: [
      {
        category: "long",
        selected: [
          "This is a very long tag that should be reflowed on smaller screens maybe",
        ],
      },
    ],
  }),
}

export const TagsWithoutImage: Story = {
  args: generateArgs({
    title: "Collection card without tags",
    image: undefined,
    description: "This is a random description that will be on the card",
    pillTags: [
      {
        category: "very long",
        selected: [
          "This is a second long link that should eat into the image area so that we can see how it looks",
        ],
      },
    ],
  }),
}

export const MultiplePlaintextTags: Story = {
  args: generateArgs({
    title: "Multiple plaintext-display groups are joined with a dot",
    description:
      "Each `plaintextTags` entry (e.g. Research, Guides) is rendered as plain text under the title, separated by a dot, and `pillTags` should never contain an entry for those same groups.",
    plaintextTags: [
      { category: "Category", selected: ["Research"] },
      { category: "Region", selected: ["Guides"] },
    ],
    pillTags: [
      {
        category: "Topic",
        selected: ["Health"],
      },
    ],
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)

    // Each plaintext group is rendered once as plain text
    await expect(screen.getByText("Research")).toBeInTheDocument()
    await expect(screen.getByText("Guides")).toBeInTheDocument()

    // pillTags renders the non-plaintext group as a pill
    await expect(screen.getByText("Health")).toBeInTheDocument()

    // The plaintext groups' own labels must not appear as pill headings
    await expect(screen.queryByText("Category")).not.toBeInTheDocument()
  },
}

export const WithDateFilter: Story = {
  args: {
    ...generateArgs({
      title: "Annual Community Charity Run 2026",
    }),
    dateFilterDisplayEntries: [
      {
        id: "event-date",
        label: "Event Date",
        dateText: "27 Sep - 29 Sep 2026",
        date: daysFromNow(-5),
        endDate: daysFromNow(5),
        statusLabels: statusLabelsFor("event-date"),
      },
    ],
  },
}

export const WithMultipleDateFilters: Story = {
  args: {
    ...generateArgs({
      title: "Item with two date filters",
    }),
    dateFilterDisplayEntries: [
      {
        id: "event-date",
        label: "Event Date",
        dateText: "27 Sep - 29 Sep 2026",
        date: daysFromNow(30),
        endDate: daysFromNow(40),
        statusLabels: statusLabelsFor("event-date"),
      },
      {
        id: "registration-deadline",
        label: "Registration Deadline",
        dateText: "1 Jan - 10 Sep 2026",
        date: daysFromNow(-5),
        endDate: daysFromNow(5),
        statusLabels: statusLabelsFor("registration-deadline"),
      },
    ],
  },
}
