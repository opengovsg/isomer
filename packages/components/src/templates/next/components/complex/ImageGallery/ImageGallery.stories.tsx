import type { Meta, StoryObj } from "@storybook/react"
import { omit } from "lodash"

import { withChromaticModes } from "@isomer/storybook-config"

import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"
import { ImageGallery } from "./ImageGallery"

const meta: Meta<ImageGalleryProps> = {
  title: "Next/Components/ImageGallery",
  component: ImageGallery,
  argTypes: {},
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
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
type Story = StoryObj<typeof ImageGallery>

const IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1688420622107-9e7c9aefd30c?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 1",
    caption: "You're so cute, I want to boop your little nose.",
  },
  {
    src: "https://images.unsplash.com/photo-1621961095257-eb44404a4dd0?q=80&w=2267&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 2",
    caption: "I hate hairballs, but you're my favorite furball.",
  },
  {
    src: "https://images.unsplash.com/photo-1496285138399-b5d7d20d1e16?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 3",
    caption: "Let's curl up to shoegaze until we fall asleep.",
  },
  {
    src: "https://plus.unsplash.com/premium_photo-1736437252009-634e1b2a41a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 4",
    caption: "You asked if I love you? I said 1 2 3 4ever... meow.",
  },
  {
    src: "https://images.unsplash.com/photo-1628406639294-5b87bae55f7c?q=80&w=3730&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 5",
    caption: "If curiosity were water, I'd be the entire fish tank.",
  },
  {
    src: "https://images.unsplash.com/photo-1577199732177-90d51f8e8601?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 6",
    caption: "I can't do anything now that the laser pointer's gone.",
  },
  {
    src: "https://images.unsplash.com/photo-1632748635837-b0ff1acf5596?q=80&w=3136&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 7",
    caption: "You're a bird I can't catch.",
  },
  {
    src: "https://images.unsplash.com/photo-1694375073673-fc3f0b706d8c?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 8",
    caption: "You nap on my keyboard rent-free.",
  },
  {
    src: "https://images.unsplash.com/photo-1742459396394-4bad6dcf0e0e?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 9",
    caption: "This house needs more catnip.",
  },
  {
    src: "https://images.unsplash.com/photo-1549141022-6b68900e53af?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Image 10",
    caption: "Climbing curtains like we did when we were kittens.",
  },
]

export const Default: Story = {
  args: {
    images: IMAGES,
  },
}

export const NoCaption: Story = {
  args: {
    images: IMAGES.map((image, index) => {
      // Remove caption for the first image
      if (index === 0) {
        return omit(image, "caption")
      }
      return image
    }),
  },
}

export const OneImage: Story = {
  args: {
    images: IMAGES.slice(0, 1),
  },
}

export const TwoImages: Story = {
  args: {
    images: IMAGES.slice(0, 2),
  },
}

export const ThreeImages: Story = {
  args: {
    images: IMAGES.slice(0, 3),
  },
}

export const FourImages: Story = {
  args: {
    images: IMAGES.slice(0, 4),
  },
}
