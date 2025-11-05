import type { Meta, StoryObj } from "@storybook/react-vite"

import type { InfopicProps } from "~/interfaces"
import InfoPic from "./Infopic"

const meta: Meta<InfopicProps> = {
  title: "Classic/Components/Infopic",
  component: InfoPic,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
}
export default meta
type Story = StoryObj<typeof InfoPic>

// Default scenario
export const Default: Story = {
  args: {
    sectionIndex: 0,
    title: "Thank you for attending the roadshows!",
    subtitle: "Coming soon to your hood",
    description: "Catch the highlights from the roadshows here.",
    imageAlt: "alt",
    imageSrc: "https://placehold.co/200x200",
    buttonLabel: "View more resources",
    buttonUrl: "https://www.google.com",
  },
}

export const DefaultGrayBackground: Story = {
  args: {
    sectionIndex: 1,
    title: "Thank you for attending the roadshows!",
    subtitle: "Coming soon to your hood",
    description: "Catch the highlights from the roadshows here.",
    imageAlt: "alt",
    imageSrc: "https://placehold.co/200x200",
    buttonLabel: "View more resources",
    buttonUrl: "https://www.google.com",
  },
}

export const DefaultRight: Story = {
  args: {
    sectionIndex: 0,
    isTextOnRight: true,
    title: "Thank you for attending the roadshows!",
    subtitle: "Coming soon to your hood",
    description: "Catch the highlights from the roadshows here.",
    imageAlt: "alt",
    imageSrc: "https://placehold.co/200x200",
    buttonLabel: "View more resources",
    buttonUrl: "https://www.google.com",
  },
}

export const TitleAndDescriptionOnly: Story = {
  args: {
    sectionIndex: 0,
    title: "Thank you for attending the roadshows!",
    description: "Catch the highlights from the roadshows here.",
    imageAlt: "alt",
    imageSrc: "https://placehold.co/200x200",
  },
}

export const InvalidImage: Story = {
  args: {
    sectionIndex: 0,
    title: "Thank you for attending the roadshows!",
    subtitle: "Coming soon to your hood",
    description: "Catch the highlights from the roadshows here.",
    imageAlt: "alt",
    imageSrc: "",
    buttonLabel: "View more resources",
    buttonUrl: "https://www.google.com",
  },
}
