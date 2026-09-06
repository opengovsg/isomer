import type { Meta, StoryObj } from "@storybook/react-vite"
import type { InfopicProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { Infopic } from "../Infopic"

const meta: Meta<InfopicProps> = {
  argTypes: {},
  args: {
    buttonLabel: "Sign up",
    buttonUrl: "/",
    description:
      "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
    headingLevel: 2,
    imageAlt:
      "Two rhinos. A rhino is peacefully grazing on grass in a field in front of the other rhino.",
    imageSrc:
      "https://images.unsplash.com/photo-1527436826045-8805c615a6df?w=1280",
    site: generateSiteConfig(),
    title:
      "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
  },
  component: Infopic,
  parameters: {
    chromatic: {
      ...withChromaticModes(["desktop", "mobile"]),
    },
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Infopic/Block",
}
export default meta
type Story = StoryObj<typeof Infopic>

// Default scenario
export const Default: Story = {}

export const TextOnRight: Story = {
  args: {
    isTextOnRight: true,
  },
}

export const NoButton: Story = {
  args: {
    buttonUrl: "",
  },
}

export const TallImage: Story = {
  args: {
    buttonUrl: "",
    description: "",
    imageSrc:
      "https://images.unsplash.com/photo-1724390495674-5f28d72c686f?q=80&w=2500&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
}

export const LongImage: Story = {
  args: {
    buttonUrl: "",
    description: "",
    imageSrc:
      "https://images.unsplash.com/photo-1444858440655-e7cf0269024e?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Don't put all your baskets in one egg",
  },
}

export const LongImageWithDesc: Story = {
  args: {
    imageSrc:
      "https://images.unsplash.com/photo-1713098372674-cbf10e8c2bba?q=80&w=3869&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Don't put all your baskets in one egg",
  },
}

export const LongTitleAndDesc: Story = {
  args: {
    description:
      "SupercalifraagelisticexpalidocioussdffwhSupercalifraagelisticexpalidocioussdffw hyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolongyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolongSupercalifraagelisticexpalidocioussdffwhyishtislolong",
    imageSrc:
      "https://images.unsplash.com/photo-1713098372674-cbf10e8c2bba?q=80&w=3869&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Supercalifraagelisticexpalidocioussdffwhyishtislolong",
  },
}

export const ShortTitleAndDesc: Story = {
  args: {
    description: "Very short",
    imageSrc:
      "https://images.unsplash.com/photo-1713098372674-cbf10e8c2bba?q=80&w=3869&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Short title",
  },
}
