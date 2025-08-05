import type { Meta, StoryObj } from "@storybook/react"

import type { InfoCardsProps } from "~/interfaces"
import type { IsomerPageLayoutType } from "~/types"
import { generateSiteConfig } from "~/stories/helpers"
import InfoCards from "./InfoCards"

const meta: Meta<InfoCardsProps> = {
  title: "Next/Components/InfoCards",
  component: InfoCards,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
  },
}
export default meta
type Story = StoryObj<typeof InfoCards>

const generateArgs = ({
  layout = "content",
  maxColumns,
  isImageFitContain = false,
  hasCTA = false,
  variant = "cardsWithImages",
  numCards = 5,
}: {
  layout?: IsomerPageLayoutType
  maxColumns: "1" | "2" | "3"
  isImageFitContain?: boolean
  hasCTA?: boolean
  variant?: InfoCardsProps["variant"]
  numCards?: number
}): InfoCardsProps => {
  const cards = [
    {
      title:
        "Testing for a card with a long line length that spans across two lines or more",
      description:
        "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      imageFit: "contain",
      url: "/faq",
    },
    {
      title: "Card with short title",
      description:
        "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
      imageUrl:
        "https://craftypixels.com/placeholder-image/800x400/ffffff/000000&text=Image+with+white+background",
      imageAlt: "alt text",
      imageFit: "contain",
    },
    {
      title: "Hover on me to see me change colors",
      description:
        "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
      imageUrl: "https://placehold.co/800x200",
      imageAlt: "alt text",
      imageFit: "contain",
      url: "https://www.google.com",
    },
    {
      title: "Testing a card with a larger image and no description",
      imageUrl: "https://placehold.co/500x500",
      imageAlt: "alt text",
      imageFit: "contain",
    },
    {
      title: "A non-placeholder image version",
      description: "This is an image that is added using a URL.",
      imageUrl:
        "https://images.unsplash.com/photo-1722260613137-f8f5ac432d69?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      imageAlt: "alt text",
      imageFit: "contain",
      url: "https://www.google.com",
    },
  ]

  const cardsLength = cards.length
  const remainder = numCards % cardsLength
  const quotient = Math.floor(numCards / cardsLength)

  const quotientCards = Array(quotient).fill(cards).flat()
  const remainderCards = cards.slice(0, remainder)
  const allCards = [...quotientCards, ...remainderCards]

  const withoutImage = variant === "cardsWithoutImages"

  if (withoutImage) {
    cards.forEach((card) => {
      delete (card as any).imageAlt
      delete (card as any).imageUrl
    })
  }

  if (!isImageFitContain) {
    cards.forEach((card) => {
      delete (card as any).imageFit
    })
  }

  return {
    layout: layout,
    title: "Section title ministry highlights",
    subtitle:
      "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
    maxColumns: maxColumns,
    variant,
    cards: allCards,
    ...(hasCTA ? { label: "This is a CTA", url: "/" } : {}),
  } as InfoCardsProps
}

export const WithImage3Columns: Story = {
  name: "With Image (3 Cols)",
  args: generateArgs({ maxColumns: "3" }),
}

export const WithImage3ColumnsHomepage: Story = {
  name: "With Image (3 Cols) Homepage",
  args: generateArgs({ maxColumns: "3", layout: "homepage" }),
}

export const WithImage2Columns: Story = {
  name: "With Image (2 Cols)",
  args: generateArgs({ maxColumns: "2" }),
}

export const WithImage2ColumnsHomepage: Story = {
  name: "With Image (2 Cols) Homepage",
  args: generateArgs({ maxColumns: "2", layout: "homepage" }),
}

export const WithImage1Columns: Story = {
  name: "With Image (1 Col)",
  args: generateArgs({ maxColumns: "1" }),
}

export const WithImage1ColumnsHomepage: Story = {
  name: "With Image (1 Col) Homepage",
  args: generateArgs({ maxColumns: "1", layout: "homepage" }),
}

export const NoImage: Story = {
  args: generateArgs({ maxColumns: "3", variant: "cardsWithoutImages" }),
}

export const WithContainImageFit: Story = {
  args: generateArgs({ maxColumns: "3", isImageFitContain: true }),
}

export const WithLink: Story = {
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithoutImages",
    hasCTA: true,
  }),
}

export const HomepageFullImage: Story = {
  name: "Homepage Full Image",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
    layout: "homepage",
  }),
}

export const ContentFullImage: Story = {
  name: "Default Full Image",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
  }),
}

export const Homepage30CardsWithFullImage: Story = {
  name: "Homepage with 30 Full Image cards",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
    layout: "homepage",
    numCards: 30,
  }),
}

export const Content30CardsWithFullImage: Story = {
  name: "30 Default cards with Full Image ",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
    numCards: 30,
  }),
}

export const Homepage3CardsWithFullImage: Story = {
  name: "Homepage with 3 Full Image cards",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
    layout: "homepage",
    numCards: 3,
  }),
}

export const Content3CardsWithFullImage: Story = {
  name: "3 Default cards with Full Image ",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
    numCards: 3,
  }),
}
export const Homepage4CardsWithFullImage: Story = {
  name: "Homepage with 4 Full Image cards",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
    layout: "homepage",
    numCards: 4,
  }),
}

export const Content4CardsWithFullImage: Story = {
  name: "4 Default cards with Full Image ",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
    numCards: 4,
  }),
}
export const Homepage6CardsWithFullImage: Story = {
  name: "Homepage with 6 Full Image cards",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
    layout: "homepage",
    numCards: 6,
  }),
}

export const Content6CardsWithFullImage: Story = {
  name: "6 Default cards with Full Image ",
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
    numCards: 6,
  }),
}
