import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { CollectionCardProps } from "~/interfaces"
import type { Tag } from "~/interfaces/internal/CollectionCard"
import { CollectionCard } from "./CollectionCard"

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

interface GenerateArgsProps {
  shouldShowDate?: boolean
  isLastUpdatedUndefined?: boolean
  withoutImage?: boolean
  title?: string
  description?: string
  tags?: Tag[]
  isExternalLink?: boolean
}
const generateArgs = ({
  shouldShowDate = true,
  isLastUpdatedUndefined = false,
  withoutImage = false,
  title = "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
  description = "We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year. We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year.",
  tags = [],
  isExternalLink = false,
}: GenerateArgsProps): Partial<CollectionCardProps> & {
  shouldShowDate?: boolean
} => {
  return {
    lastUpdated: isLastUpdatedUndefined ? undefined : "December 2, 2023",
    category: "Research",
    title,
    description,
    image: withoutImage
      ? undefined
      : {
          src: "https://placehold.co/500x500",
          alt: "placeholder",
        },
    referenceLinkHref: isExternalLink ? "https://www.google.com" : "/",
    imageSrc: "https://placehold.co/500x500",
    itemTitle: title,
    shouldShowDate,
    tags,
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

// TODO: fix external link icon not visible when the text is being truncated
// because the icon is at the end of the text
// export const ExternalLinkLongText: Story = {
//   args: generateArgs({ isExternalLink: true }),
// }

export const UndefinedDate: Story = {
  args: generateArgs({ isLastUpdatedUndefined: true }),
}

export const HideDate: Story = {
  args: generateArgs({
    shouldShowDate: false,
    isLastUpdatedUndefined: true,
  }),
}

export const CardWithoutImage: Story = {
  args: generateArgs({ withoutImage: true }),
}

export const ShortDescription: Story = {
  args: generateArgs({
    title: "Short title",
    description: "Short description",
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
    withoutImage: true,
    description: "This is a random description that will be on the card",
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
