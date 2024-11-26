import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { CollectionCardProps } from "~/interfaces"
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
  isLastUpdatedUndefined = false,
  withoutImage = false,
  title = "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
  description = "We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year. We've looked at how people's spending correlates with how much microscopic plastic they consumed over the year.",
}: {
  shouldShowDate?: boolean
  isLastUpdatedUndefined?: boolean
  withoutImage?: boolean
  title?: string
  description?: string
}): Partial<CollectionCardProps> & { shouldShowDate?: boolean } => {
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
    referenceLinkHref: "/",
    imageSrc: "https://placehold.co/500x500",
    itemTitle: title,
    shouldShowDate,
  }
}

export const Default: Story = {
  args: generateArgs({}),
}

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
