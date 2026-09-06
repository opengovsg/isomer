import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CollectionCardProps } from "~/interfaces"
import { expect, within } from "storybook/test"

import { withChromaticModes } from "@isomer/storybook-config"

import { BlogCard } from "./BlogCard"

const meta: Meta<typeof BlogCard> = {
  argTypes: {},
  component: BlogCard,
  parameters: {
    chromatic: withChromaticModes(["desktop", "mobile"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/Blog Card",
}
export default meta
type Story = StoryObj<typeof BlogCard>

const generateArgs = ({
  isExternalLink = false,
  shouldShowDate = true,
  ...overrides
}: Partial<CollectionCardProps> & {
  isExternalLink?: boolean
  shouldShowDate?: boolean
}): Partial<CollectionCardProps> & {
  shouldShowDate?: boolean
} => ({
  date: new Date("2023-12-02"),
  description:
    "We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year. We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year.",
  image: {
    alt: "placeholder",
    src: "https://placehold.co/500x500",
  },
  imageSrc: "https://placehold.co/500x500",
  itemTitle:
    "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
  pillTags: [],
  plaintextTags: [{ category: "Category", selected: ["Research"] }],
  referenceLinkHref: isExternalLink ? "https://www.google.com" : "/",
  shouldShowDate,
  title:
    "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
  ...overrides,
})

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

// NOTE: ideally when the text is being truncated,
// the external link icon should be at the end of the text instead of the newline
export const ExternalLinkLongText: Story = {
  args: generateArgs({ isExternalLink: true }),
}

export const UndefinedDate: Story = {
  args: generateArgs({ date: undefined }),
}

export const HideDate: Story = {
  args: generateArgs({
    date: undefined,
    shouldShowDate: false,
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
    description: "Short description",
    title: "Short title",
  }),
}

export const DescriptionWithOnlyWhitespace: Story = {
  args: generateArgs({
    description: "   ",
    title: "Short title",
  }),
}

export const TagsWithImage: Story = {
  args: generateArgs({
    description: "This is a random description that will be on the card",
    pillTags: [
      {
        category: "long",
        selected: [
          "This is a very long tag that should be reflowed on smaller screens maybe",
        ],
      },
    ],
    title: "Collection card with tags",
  }),
}

export const TagsWithoutImage: Story = {
  args: generateArgs({
    description: "This is a random description\nthat will be on the card",
    image: undefined,
    pillTags: [
      {
        category: "very long",
        selected: [
          "This is a second long link that should eat into the image area so that we can see how it looks",
        ],
      },
    ],
    title: "Collection card without tags",
  }),
}

export const MultiplePlaintextTags: Story = {
  args: generateArgs({
    description:
      "Each `plaintextTags` entry (e.g. Research, Guides) is rendered as plain text under the title, separated by a dot, and `pillTags` should never contain an entry for those same groups.",
    pillTags: [
      {
        category: "Topic",
        selected: ["Health"],
      },
    ],
    plaintextTags: [
      { category: "Category", selected: ["Research"] },
      { category: "Region", selected: ["Guides"] },
    ],
    title: "Multiple plaintext-display groups are joined with a dot",
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
