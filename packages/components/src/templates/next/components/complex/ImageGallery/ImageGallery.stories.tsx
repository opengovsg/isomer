import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"
import { omit } from "lodash-es"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { ImageGallery } from "./ImageGallery"

const meta: Meta<ImageGalleryProps> = {
  argTypes: {},
  args: {
    site: generateSiteConfig(),
  },
  component: ImageGallery,
  title: "Next/Components/ImageGallery",
}
export default meta
type Story = StoryObj<typeof ImageGallery>

const IMAGES = [
  {
    alt: "Image 1",
    caption: "You're so cute, I want to boop your little nose.",
    src: "https://images.unsplash.com/photo-1688420622107-9e7c9aefd30c?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    alt: "Image 2",
    caption: "I hate hairballs, but you're my favorite furball.",
    src: "https://images.unsplash.com/photo-1621961095257-eb44404a4dd0?q=80&w=2267&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    alt: "Image 3",
    caption: "Let's curl up to shoegaze until we fall asleep.",
    src: "https://images.unsplash.com/photo-1496285138399-b5d7d20d1e16?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    alt: "Image 4",
    caption: "You asked if I love you? I said 1 2 3 4ever... meow.",
    src: "https://plus.unsplash.com/premium_photo-1736437252009-634e1b2a41a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    alt: "Image 5",
    caption: "If curiosity were water, I'd be the entire fish tank.",
    src: "https://images.unsplash.com/photo-1628406639294-5b87bae55f7c?q=80&w=3730&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    alt: "Image 6",
    caption: "I can't do anything now that the laser pointer's gone.",
    src: "https://images.unsplash.com/photo-1577199732177-90d51f8e8601?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    alt: "Image 7",
    caption: "You're a bird I can't catch.",
    src: "https://images.unsplash.com/photo-1632748635837-b0ff1acf5596?q=80&w=3136&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    alt: "Image 8",
    caption: "You nap on my keyboard rent-free.",
    src: "https://images.unsplash.com/photo-1694375073673-fc3f0b706d8c?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    alt: "Image 9",
    caption: "This house needs more catnip.",
    src: "https://images.unsplash.com/photo-1742459396394-4bad6dcf0e0e?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    alt: "Image 10",
    caption:
      "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked.",
    src: "https://images.unsplash.com/photo-1549141022-6b68900e53af?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
]

export const Default: Story = {
  args: {
    images: IMAGES,
  },
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
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
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
  },
}

export const OneImage: Story = {
  args: {
    images: IMAGES.slice(0, 1),
  },
  parameters: {
    chromatic: withChromaticModes(["tablet", "desktop"]),
    layout: "fullscreen",
  },
}

export const TwoImages: Story = {
  args: {
    images: IMAGES.slice(0, 2),
  },
  parameters: {
    chromatic: withChromaticModes(["tablet", "desktop"]),
    layout: "fullscreen",
  },
}

export const ThreeImages: Story = {
  args: {
    images: IMAGES.slice(0, 3),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
    layout: "fullscreen",
  },
}

export const FourImages: Story = {
  args: {
    images: IMAGES.slice(0, 4),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
    layout: "fullscreen",
  },
}

export const NavigateByClickingPreview: Story = {
  args: {
    images: IMAGES.slice(0, 3),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
    layout: "fullscreen",
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const previewImageButton = screen.getByRole("button", {
      name: "View image 2 of 3",
    })
    await userEvent.click(previewImageButton)

    const text = await screen.findByText(
      "I hate hairballs, but you're my favorite furball.",
    )
    await waitFor(
      async () => {
        await expect(text).toBeVisible()
      },
      { timeout: 3000 },
    )
  },
}

export const NavigateByRightArrow: Story = {
  args: {
    images: IMAGES.slice(0, 3),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
    layout: "fullscreen",
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const nextButton = screen.getByRole("button", { name: "Next image" })
    await userEvent.click(nextButton)

    const text = await screen.findByText(
      "I hate hairballs, but you're my favorite furball.",
    )
    await waitFor(
      async () => {
        await expect(text).toBeVisible()
      },
      { timeout: 3000 },
    )
  },
}

export const NavigateByLeftArrow: Story = {
  args: {
    images: IMAGES.slice(0, 3),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
    layout: "fullscreen",
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const previousButton = screen.getByRole("button", {
      name: "Previous image",
    })
    await userEvent.click(previousButton)

    const text = await screen.findByText(
      "Let's curl up to shoegaze until we fall asleep.",
    )
    await waitFor(
      async () => {
        await expect(text).toBeVisible()
      },
      { timeout: 3000 },
    )
  },
}

export const NavigateByRightArrowKeyboard: Story = {
  args: {
    images: IMAGES.slice(0, 3),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
    layout: "fullscreen",
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const nextButton = screen.getByRole("button", { name: "Next image" })
    nextButton.focus()
    await userEvent.keyboard("{Enter}")

    const text = await screen.findByText(
      "I hate hairballs, but you're my favorite furball.",
    )
    await waitFor(
      async () => {
        await expect(text).toBeVisible()
      },
      { timeout: 3000 },
    )
  },
}

export const NavigateByLeftArrowKeyboard: Story = {
  args: {
    images: IMAGES.slice(0, 3),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
    layout: "fullscreen",
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const previousButton = screen.getByRole("button", {
      name: "Previous image",
    })
    previousButton.focus()
    await userEvent.keyboard("{Enter}")

    const text = await screen.findByText(
      "Let's curl up to shoegaze until we fall asleep.",
    )
    await waitFor(
      async () => {
        await expect(text).toBeVisible()
      },
      { timeout: 3000 },
    )
  },
}
