import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CollectionCardProps } from "~/interfaces"
import { expect, within } from "storybook/test"

import { withChromaticModes } from "@isomer/storybook-config"

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
