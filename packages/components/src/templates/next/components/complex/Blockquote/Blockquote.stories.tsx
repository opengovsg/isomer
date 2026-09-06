import type { Meta, StoryObj } from "@storybook/react-vite"
import type { BlockquoteProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Blockquote } from "./Blockquote"

const meta: Meta<BlockquoteProps> = {
  argTypes: {},
  args: {
    site: generateSiteConfig(),
  },
  component: Blockquote,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Blockquote",
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
    imageAlt: "This is the alt text",
    imageSrc: "https://placehold.co/600x600",
    quote:
      "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail.",
    source:
      "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
  },
}

export const ManyWordsWithImage: Story = {
  args: {
    imageAlt: "This is the alt text",
    imageSrc: "https://placehold.co/600x600",
    quote:
      "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail. When I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew us being there would help spur me to prevail.",
    source:
      "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
  },
}

export const MinimalWordsWithImage: Story = {
  args: {
    imageAlt: "This is the alt text",
    imageSrc: "https://placehold.co/600x600",
    quote: "Hi",
    source: "Me",
  },
}

export const HomepageWithoutImage: Story = {
  args: {
    layout: "homepage",
    quote:
      "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail.",
    source:
      "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
  },
}

export const HomepageWithImage: Story = {
  args: {
    imageAlt: "This is the alt text",
    imageSrc: "https://placehold.co/600x600",
    layout: "homepage",
    quote:
      "When I was a rookie, I had trouble overcoming the low rope at first. But when it came to my turn, my buddies knew being there would help spur me to prevail.",
    source:
      "ME2 Jenny Teng, Recipient of SAF Polytechnic Sponsorship, Army Medical Services",
  },
}

export const HomepageMinimalWordsWithImage: Story = {
  args: {
    imageAlt: "This is the alt text",
    imageSrc: "https://placehold.co/600x600",
    layout: "homepage",
    quote: "Hi",
    source: "Me",
  },
}
