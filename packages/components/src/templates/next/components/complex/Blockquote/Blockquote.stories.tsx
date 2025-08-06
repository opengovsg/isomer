import type { Meta, StoryObj } from "@storybook/react"

import type { BlockquoteProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"
import { Blockquote } from "./Blockquote"

const meta: Meta<BlockquoteProps> = {
  title: "Next/Components/Blockquote",
  component: Blockquote,
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
type Story = StoryObj<typeof Blockquote>

export const WithoutImage: Story = {
  args: {
    quote:
      "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail.",
    source:
      "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
  },
}

export const WithImage: Story = {
  args: {
    quote:
      "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail.",
    source:
      "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
    imageSrc: "https://placehold.co/600x600",
    imageAlt: "This is the alt text",
  },
}

export const ManyWordsWithImage: Story = {
  args: {
    quote:
      "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail. When I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew us being there would help spur me to prevail.",
    source:
      "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
    imageSrc: "https://placehold.co/600x600",
    imageAlt: "This is the alt text",
  },
}

export const MinimalWordsWithImage: Story = {
  args: {
    quote: "Hi",
    source: "Me",
    imageSrc: "https://placehold.co/600x600",
    imageAlt: "This is the alt text",
  },
}

export const HomepageWithoutImage: Story = {
  args: {
    quote:
      "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail.",
    source:
      "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
    layout: "homepage",
  },
}

export const HomepageWithImage: Story = {
  args: {
    quote:
      "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail.",
    source:
      "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
    imageSrc: "https://placehold.co/600x600",
    imageAlt: "This is the alt text",
    layout: "homepage",
  },
}

export const HomepageMinimalWordsWithImage: Story = {
  args: {
    quote: "Hi",
    source: "Me",
    imageSrc: "https://placehold.co/600x600",
    imageAlt: "This is the alt text",
    layout: "homepage",
  },
}
