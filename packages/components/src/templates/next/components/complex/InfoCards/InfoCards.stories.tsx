import type { Meta, StoryObj } from "@storybook/react"

import type { InfoCardsProps } from "~/interfaces"
import type { IsomerPageLayoutType } from "~/types"
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
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/isomer-logo.svg",
      lastUpdated: "2021-10-01",
      assetsBaseUrl: "https://cms.isomer.gov.sg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof InfoCards>

const generateArgs = ({
  layout = "content",
  maxColumns,
  withoutImage = false,
  isImageFitContain = false,
  hasCTA = false,
}: {
  layout?: IsomerPageLayoutType
  maxColumns: "1" | "2" | "3"
  withoutImage?: boolean
  isImageFitContain?: boolean
  hasCTA?: boolean
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
    variant: withoutImage ? "cardsWithoutImages" : "cardsWithImages",
    cards: cards,
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
  args: generateArgs({ maxColumns: "3", withoutImage: true }),
}

export const WithContainImageFit: Story = {
  args: generateArgs({ maxColumns: "3", isImageFitContain: true }),
}

export const WithLink: Story = {
  args: generateArgs({ maxColumns: "3", withoutImage: true, hasCTA: true }),
}
