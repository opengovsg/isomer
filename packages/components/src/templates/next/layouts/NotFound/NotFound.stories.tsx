import type { Meta, StoryObj } from "@storybook/react-vite"

import { withChromaticModes } from "@isomer/storybook-config"

import type { NotFoundPageSchemaType } from "~/types"
import { generateSiteConfig } from "~/stories/helpers"
import { NotFoundLayout } from "./NotFound"

const meta: Meta<typeof NotFoundLayout> = {
  title: "Next/Layouts/NotFound",
  component: NotFoundLayout,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<NotFoundPageSchemaType>

export const NoFuzzyMatches: Story = {
  args: {
    layout: "notfound",
    site: generateSiteConfig({
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "About Us",
            permalink: "/about-us",
            lastModified: "",
            layout: "content",
            summary: "",
          },
          {
            id: "3",
            title: "Contact",
            permalink: "/contact",
            lastModified: "",
            layout: "content",
            summary: "",
          },
          {
            id: "4",
            title: "Services",
            permalink: "/services",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
    }),
    meta: {
      description: "No matching results",
    },
    page: {
      title: "Search",
      permalink: "/xyz-quantum-blockchain-metaverse",
      lastModified: "2024-05-02T14:12:57.160Z",
    },
  },
}

export const WithFuzzyMatches: Story = {
  args: {
    layout: "notfound",
    site: generateSiteConfig({
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Career Opportunities",
            permalink: "/career-opportunities",
            lastModified: "",
            layout: "content",
            summary: "",
          },
          {
            id: "3",
            title: "Careers at Our Company",
            permalink: "/careers-at-our-company",
            lastModified: "",
            layout: "content",
            summary: "",
          },
          {
            id: "4",
            title: "Job Openings",
            permalink: "/job-openings",
            lastModified: "",
            layout: "content",
            summary: "",
          },
          {
            id: "5",
            title: "About Us",
            permalink: "/about-us",
            lastModified: "",
            layout: "content",
            summary: "",
          },
          {
            id: "6",
            title: "Contact",
            permalink: "/contact",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
    }),
    meta: {
      description: "Found matching results",
    },
    page: {
      title: "Search",
      permalink: "/careers",
      lastModified: "2024-05-02T14:12:57.160Z",
    },
  },
}
