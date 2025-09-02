import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { CollectionCardProps } from "~/interfaces"
import { BlogCard } from "./BlogCard"

const meta: Meta<typeof BlogCard> = {
  title: "Next/Internal Components/Blog Card",
  component: BlogCard,
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
} => {
  return {
    date: new Date("2023-12-02"),
    category: "Research",
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
    tags: [],
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
    tags: [
      {
        category: "long",
        selected: [
          "This is a very long tag that shuold be reflowed on smaller screens maybe",
        ],
      },
    ],
  }),
}

export const TagsWithoutImage: Story = {
  args: generateArgs({
    title: "Collection card without tags",
    image: undefined,
    description: "This is a random description\nthat will be on the card",
    tags: [
      {
        category: "very long",
        selected: [
          "This is a second long link that should eat into the image area so that we can see how it looks",
        ],
      },
    ],
  }),
}
