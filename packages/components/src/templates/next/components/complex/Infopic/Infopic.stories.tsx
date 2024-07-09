import type { Meta, StoryObj } from "@storybook/react"

import type { InfopicProps } from "~/interfaces"
import InfoPic from "./Infopic"

const meta: Meta<InfopicProps> = {
  title: "Next/Components/Infopic",
  component: InfoPic,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof InfoPic>

// Default scenario
export const SideBySide: Story = {
  args: {
    sectionIndex: 0,
    variant: "side-by-side",
    title: "Lemon. Think small.",
    description:
      "Our little car isn't so much of a novelty anymore. An ode to Ogilvy.",
    imageAlt: "alt",
    imageSrc:
      "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=3795&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonLabel: "Buy one",
    buttonUrl: "https://www.google.com",
  },
}

export const SideBySideRightVariant: Story = {
  args: {
    sectionIndex: 0,
    variant: "side-by-side",
    isTextOnRight: true,
    title: "Meet Simone Yi Ting Tan",
    description:
      "Simone is our Management Associate from batch 2024. Simone is currently on her third rotation in the Energy Trading department.",
    imageAlt: "alt",
    imageSrc: "https://placehold.co/400x300",
    buttonLabel: "Simone's Journey",
    buttonUrl: "https://www.google.com",
  },
}

export const SidePart: Story = {
  args: {
    sectionIndex: 0,
    variant: "side-part",
    title:
      "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
    description:
      "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
    imageAlt: "alt",
    imageSrc: "https://placehold.co/1000x200",
    buttonLabel: "Primary CTA",
    buttonUrl: "https://www.google.com",
  },
}

export const SidePartRightVariant: Story = {
  args: {
    sectionIndex: 0,
    variant: "side-part",
    isTextOnRight: true,
    title:
      "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
    description:
      "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
    imageAlt: "alt",
    imageSrc: "https://placehold.co/200x200",
    buttonLabel: "Primary CTA",
    buttonUrl: "https://www.google.com",
  },
}
