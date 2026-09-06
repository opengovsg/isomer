import type { Meta, StoryObj } from "@storybook/react-vite"
import type { InfoCardsProps } from "~/interfaces"
import type { IsomerPageLayoutType } from "~/types"
import { generateSiteConfig } from "~/stories/helpers"

import { InfoCards } from "./InfoCards"

const meta: Meta<InfoCardsProps> = {
  argTypes: {},
  args: {
    site: generateSiteConfig(),
  },
  component: InfoCards,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/InfoCards",
}
export default meta
type Story = StoryObj<typeof InfoCards>

const generateArgs = ({
  layout = "content",
  maxColumns,
  isImageFitContain = false,
  hasCTA = false,
  variant = "cardsWithImages",
  numCards = 6,
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
      description:
        "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageAlt: "alt text",
      imageFit: "contain",
      imageUrl: "https://placehold.co/200x300",
      title:
        "Testing for a card with a long line length that spans across two lines or more",
      url: "/faq",
    },
    {
      description:
        "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
      imageAlt: "alt text",
      imageFit: "contain",
      imageUrl:
        "https://craftypixels.com/placeholder-image/800x400/ffffff/000000&text=Image+with+white+background",
      title: "Card with short title",
    },
    {
      description:
        "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
      imageAlt: "alt text",
      imageFit: "contain",
      imageUrl: "https://placehold.co/800x200",
      title: "Hover on me to see me change colors",
      url: "https://www.google.com",
    },
    {
      imageAlt: "alt text",
      imageFit: "contain",
      imageUrl: "https://placehold.co/500x500",
      title: "Testing a card with a larger image and no description",
    },
    {
      description: "This is an image that is added using a URL.",
      imageAlt: "alt text",
      imageFit: "contain",
      imageUrl:
        "https://images.unsplash.com/photo-1722260613137-f8f5ac432d69?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: "A non-placeholder image version",
      url: "https://www.google.com",
    },
    {
      description:
        "A wonderful serenity has taken possession of my entire soul, like these sweet mornings of spring which I enjoy with my whole heart. I am alone, and feel the charm of existence in this spot, which was created for the bliss of souls like mine. I am so happy, my dear friend, so absorbed in the exquisite sense of mere tranquil existence, that I neglect my talents. I should be incapable of drawing a single stroke at the present moment; and yet I feel that I never was a greater artist than now. When,.",
      imageAlt: "alt text",
      imageFit: "contain",
      imageUrl: "https://placehold.co/500x500",
      title: "A card with a very long description",
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
    for (const card of cards) {
      // SAFETY: Story args omit image fields for cardsWithoutImages variant
      delete (card as { imageAlt?: string; imageUrl?: string }).imageAlt
      // SAFETY: Story args omit image fields for cardsWithoutImages variant
      delete (card as { imageAlt?: string; imageUrl?: string }).imageUrl
    }
  }

  if (!isImageFitContain) {
    for (const card of cards) {
      // SAFETY: Story args omit imageFit unless testing contain fit
      delete (card as { imageFit?: string }).imageFit
    }
  }

  const baseArgs = {
    cards: allCards,
    headingLevel: 2,
    layout,
    maxColumns,
    subtitle:
      "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
    title: "Section title ministry highlights",
    variant,
  }

  if (hasCTA) {
    // SAFETY: generateArgs builds a complete InfoCardsProps object for Storybook
    return {
      ...baseArgs,
      label: "This is a CTA",
      url: "/",
    } as InfoCardsProps
  }

  // SAFETY: generateArgs builds a complete InfoCardsProps object for Storybook
  return baseArgs as InfoCardsProps
}

export const WithImage3Columns: Story = {
  args: generateArgs({ maxColumns: "3" }),
  name: "With Image (3 Cols)",
}

export const WithImage3ColumnsHomepage: Story = {
  args: generateArgs({ layout: "homepage", maxColumns: "3" }),
  name: "With Image (3 Cols) Homepage",
}

export const WithImage2Columns: Story = {
  args: generateArgs({ maxColumns: "2" }),
  name: "With Image (2 Cols)",
}

export const WithImage2ColumnsHomepage: Story = {
  args: generateArgs({ layout: "homepage", maxColumns: "2" }),
  name: "With Image (2 Cols) Homepage",
}

export const WithImage1Columns: Story = {
  args: generateArgs({ maxColumns: "1" }),
  name: "With Image (1 Col)",
}

export const WithImage1ColumnsHomepage: Story = {
  args: generateArgs({ layout: "homepage", maxColumns: "1" }),
  name: "With Image (1 Col) Homepage",
}

export const NoImage: Story = {
  args: generateArgs({ maxColumns: "3", variant: "cardsWithoutImages" }),
}

export const WithContainImageFit: Story = {
  args: generateArgs({ isImageFitContain: true, maxColumns: "3" }),
}

export const WithLink: Story = {
  args: generateArgs({
    hasCTA: true,
    maxColumns: "3",
    variant: "cardsWithoutImages",
  }),
}

export const HomepageFullImage: Story = {
  args: generateArgs({
    layout: "homepage",
    maxColumns: "3",
    variant: "cardsWithFullImages",
  }),
  name: "Homepage Full Image",
}

export const ContentFullImage: Story = {
  args: generateArgs({
    maxColumns: "3",
    variant: "cardsWithFullImages",
  }),
  name: "Default Full Image",
}

export const Homepage30CardsWithFullImage: Story = {
  args: generateArgs({
    layout: "homepage",
    maxColumns: "3",
    numCards: 30,
    variant: "cardsWithFullImages",
  }),
  name: "Homepage with 30 Full Image cards",
}

export const Content30CardsWithFullImage: Story = {
  args: generateArgs({
    maxColumns: "3",
    numCards: 30,
    variant: "cardsWithFullImages",
  }),
  name: "30 Default cards with Full Image ",
}

export const Homepage3CardsWithFullImage: Story = {
  args: generateArgs({
    layout: "homepage",
    maxColumns: "3",
    numCards: 3,
    variant: "cardsWithFullImages",
  }),
  name: "Homepage with 3 Full Image cards",
}

export const Content3CardsWithFullImage: Story = {
  args: generateArgs({
    maxColumns: "3",
    numCards: 3,
    variant: "cardsWithFullImages",
  }),
  name: "3 Default cards with Full Image ",
}
export const Homepage4CardsWithFullImage: Story = {
  args: generateArgs({
    layout: "homepage",
    maxColumns: "3",
    numCards: 4,
    variant: "cardsWithFullImages",
  }),
  name: "Homepage with 4 Full Image cards",
}

export const Content4CardsWithFullImage: Story = {
  args: generateArgs({
    maxColumns: "3",
    numCards: 4,
    variant: "cardsWithFullImages",
  }),
  name: "4 Default cards with Full Image ",
}
export const Homepage6CardsWithFullImage: Story = {
  args: generateArgs({
    layout: "homepage",
    maxColumns: "3",
    numCards: 6,
    variant: "cardsWithFullImages",
  }),
  name: "Homepage with 6 Full Image cards",
}

export const Content6CardsWithFullImage: Story = {
  args: generateArgs({
    maxColumns: "3",
    numCards: 6,
    variant: "cardsWithFullImages",
  }),
  name: "6 Default cards with Full Image ",
}

/** Full-image grid uses `maxColumns` (here: 7 cards with 2 columns). */
export const FullImageSevenCardsMaxColumnsTwo: Story = {
  args: generateArgs({
    maxColumns: "2",
    numCards: 7,
    variant: "cardsWithFullImages",
  }),
  name: "Full Image: 7 cards (maxColumns 2)",
}

/** Same card count with `maxColumns` 3 for comparison. */
export const FullImageSevenCardsMaxColumnsThree: Story = {
  args: generateArgs({
    maxColumns: "3",
    numCards: 7,
    variant: "cardsWithFullImages",
  }),
  name: "Full Image: 7 cards (maxColumns 3)",
}
