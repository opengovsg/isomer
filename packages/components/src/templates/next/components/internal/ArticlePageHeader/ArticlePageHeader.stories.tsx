import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ArticlePageHeaderProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"

import { ArticlePageHeader } from "./ArticlePageHeader"

const pad = (n: number): string => n.toString().padStart(2, "0")
const toDateString = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

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

const meta: Meta<ArticlePageHeaderProps> = {
  title: "Next/Internal Components/ArticlePageHeader",
  component: ArticlePageHeader,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof ArticlePageHeader>

const ARTICLE = {
  breadcrumb: {
    links: [
      {
        title: "Newsroom",
        url: "/newsroom",
      },
      {
        title: "News",
        url: "/newsroom/news",
      },
      {
        title:
          "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
        url: "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
      },
    ],
  },
  plaintextTags: [{ category: "Category", selected: ["NParks Happenings"] }],
  title:
    "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
  date: "1 May 2024",
  summary:
    "20 pieces of rhinoceros horns were found in two pieces of transit baggage bound for Laos. The 34.7 kg seizure is the largest seizure of rhinoceros horns in Singapore to date.",
}

export const SingleSummaryItem: Story = {
  args: ARTICLE,
}

export const WithoutCategory: Story = {
  args: {
    ...ARTICLE,
    plaintextTags: [],
  },
}

export const MultiplePlaintextGroups: Story = {
  args: {
    ...ARTICLE,
    plaintextTags: [
      { category: "Category", selected: ["NParks Happenings"] },
      { category: "Region", selected: ["Wildlife"] },
    ],
  },
}

export const ArticleWithTags: Story = {
  args: {
    ...ARTICLE,
    // NOTE: `pillTags` here is expected to already exclude any
    // `display: "plaintext"` groups (see Article.tsx's `pillTags`), so
    // that they aren't duplicated as a pill.
    pillTags: [
      {
        category: "Tags",
        selected: ["NParks Happenings", "Wild dinosaur"],
      },
    ],
  },
}

export const WithDateFilter: Story = {
  args: {
    ...ARTICLE,
    title: "Annual Community Charity Run 2026",
    dateTagged: [
      {
        id: "event-date",
        date: daysFromNow(-5),
        endDate: daysFromNow(5),
      },
    ],
    tagCategories: DATE_FILTER_TAG_CATEGORIES,
  },
}

export const WithMultipleDateFilters: Story = {
  args: {
    ...ARTICLE,
    title: "Item with two date filters",
    dateTagged: [
      {
        id: "event-date",
        date: daysFromNow(30),
        endDate: daysFromNow(40),
      },
      {
        id: "registration-deadline",
        date: daysFromNow(-5),
        endDate: daysFromNow(5),
      },
    ],
    tagCategories: DATE_FILTER_TAG_CATEGORIES,
  },
}
