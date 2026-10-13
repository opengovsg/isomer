import type { Meta, StoryObj } from "@storybook/react-vite"
import type { InfopicProps } from "~/interfaces/complex/Infopic"
import { generateSiteConfig } from "~/stories/helpers"

import { renderComponent } from "../next/render/renderComponent"

const ThemedInfopic = (props: InfopicProps) =>
  renderComponent({
    component: props,
    site: props.site,
    headingLevel: props.headingLevel,
    layout: "homepage",
    permalink: "/",
    shouldLazyLoad: props.shouldLazyLoad,
  })

const meta = {
  title: "Themes/Infopic",
  component: ThemedInfopic,
  parameters: {
    layout: "fullscreen",
    themes: { themeOverride: "Isomer Classic" },
  },
  args: {
    type: "infopic",
    title: "Our services",
    description:
      "The same content and presentation options, rendered by a different theme.",
    imageSrc: "https://placehold.co/600x600",
    imageAlt: "Example image",
    buttonLabel: "Find out more",
    buttonUrl: "/services",
    headingLevel: 2,
    site: generateSiteConfig({ theme: "isomer-classic" }),
  },
} satisfies Meta<typeof ThemedInfopic>
export default meta
type Story = StoryObj<typeof meta>

export const Classic: Story = {}
export const Next: Story = {
  args: { site: generateSiteConfig() },
  parameters: { themes: { themeOverride: "Isomer Next" } },
}
export const TextOnRight: Story = { args: { isTextOnRight: true } }
export const FullImage: Story = { args: { variant: "full" } }
export const Minimal: Story = {
  args: {
    description: undefined,
    buttonLabel: undefined,
    buttonUrl: undefined,
  },
}
export const LongContent: Story = {
  args: {
    title: "A longer heading that wraps across multiple lines",
    description: "Long descriptive content. ".repeat(40),
  },
}
export const InvalidImage: Story = {
  args: { imageSrc: "/missing-reference-image.jpg" },
}
