import type { Meta, StoryObj } from "@storybook/react"

import type { InfoCardsProps } from "~/interfaces"
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
}
export default meta
type Story = StoryObj<typeof InfoCards>

export const WithImage: Story = {
  args: {
    title: "Section title ministry highlights",
    subtitle:
      "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
    variant: "cardsWithImages",
    cards: [
      {
        title:
          "Testing for a card with a long line length that spans across two lines or more",
        description:
          "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
        imageUrl: "https://placehold.co/200x300",
        imageAlt: "alt text",
        url: "https://www.google.com",
      },
      {
        title: "Card with short title",
        description:
          "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
        imageUrl:
          "https://craftypixels.com/placeholder-image/800x400/ffffff/000000&text=Image+with+white+background",
        imageAlt: "alt text",
      },
      {
        title: "Hover on me to see me change colors",
        description:
          "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
        imageUrl: "https://placehold.co/800x200",
        imageAlt: "alt text",
        url: "https://www.google.com",
      },
      {
        title: "Testing a card with a larger image and no description",
        imageUrl: "https://placehold.co/500x500",
        imageAlt: "alt text",
      },
      {
        title: "A non-placeholder image version",
        description: "This is an image that is added using a URL.",
        imageUrl:
          "https://images.unsplash.com/photo-1722260613137-f8f5ac432d69?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        imageAlt: "alt text",
        url: "https://www.google.com",
      },
    ],
  },
}

export const NoImage: Story = {
  args: {
    title: "Section title ministry highlights",
    subtitle:
      "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
    variant: "cardsWithoutImages",
    cards: [
      {
        title:
          "Testing for a card with a long line length that spans across two lines or more",
        description:
          "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
        url: "https://www.google.com",
      },
      {
        title: "Card with short title",
        description:
          "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
      },
      {
        title: "Hover on me to see me change colors",
        description:
          "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
        url: "https://www.google.com",
      },
      {
        title: "A yummy, tipsy evening at Duxton",
      },
    ],
  },
}

export const WithContainImageFit: Story = {
  args: {
    title: "Section title ministry highlights",
    subtitle:
      "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
    variant: "cardsWithImages",
    cards: [
      {
        title:
          "Testing for a card with a long line length that spans across two lines or more",
        description:
          "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
        imageUrl: "https://placehold.co/200x300",
        imageAlt: "alt text",
        imageFit: "contain",
        url: "https://www.google.com",
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
        url: "https://www.google.com",
        imageFit: "contain",
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
        url: "https://www.google.com",
        imageFit: "contain",
      },
    ],
  },
}
