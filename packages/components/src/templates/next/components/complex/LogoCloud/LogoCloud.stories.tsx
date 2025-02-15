import type { Meta, StoryObj } from "@storybook/react"

import type { IsomerSiteProps } from "~/types"
import { LogoCloud } from "./LogoCloud"

const meta: Meta<typeof LogoCloud> = {
  title: "Next/Components/Logo Cloud",
  component: LogoCloud,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof LogoCloud>

const IMAGE = { src: "https://placehold.co/150", alt: "placeholder" }
const HORIZONTAL_IMAGE = {
  src: "https://placehold.co/1000x100",
  alt: "placeholder",
}
const VERTICAL_IMAGE = {
  src: "https://placehold.co/100x1000",
  alt: "placeholder",
}
const site: IsomerSiteProps = {
  siteName: "Isomer Next",
  siteMap: {
    id: "1",
    title: "Home",
    permalink: "/",
    lastModified: "",
    layout: "homepage",
    summary: "",
  },
  theme: "isomer-next",
  isGovernment: true,
  logoUrl: "/.storybook/assets/isomer-logo.svg",
  navBarItems: [],
  footerItems: {
    privacyStatementLink: "https://www.isomer.gov.sg/privacy",
    termsOfUseLink: "https://www.isomer.gov.sg/terms",
    siteNavItems: [],
  },
  lastUpdated: "1 Jan 2021",
  search: {
    type: "searchSG",
    clientId: "",
  },
}

// Default scenario
export const Default: Story = {
  args: {
    images: [IMAGE],
    site,
  },
}

export const ManyImages: Story = {
  args: {
    images: Array(10).fill(IMAGE),
    site,
  },
}

export const Agency: Story = {
  args: {
    images: [
      {
        alt: "Some image",
        src: "https://www.ncss.gov.sg/images/default-source/asset/fwdsg_logo.png?sfvrsn=91b23ea8_1",
      },
      {
        alt: "Some image",
        src: "https://www.ncss.gov.sg/images/default-source/asset/togsgcares_logo.png?sfvrsn=d499b7ea_2",
      },
      {
        alt: "Some image",
        src: "https://www.ncss.gov.sg/images/default-source/asset/celebrating-volunteers-logo.png?sfvrsn=44b85185_2 ",
      },
    ],
    site,
  },
}

export const HugeHorizontalLogo: Story = {
  args: {
    images: [...Array(4).fill(IMAGE), HORIZONTAL_IMAGE],
    site,
  },
}

export const HugeVerticalLogo: Story = {
  args: {
    images: [...Array(4).fill(IMAGE), VERTICAL_IMAGE],
    site,
  },
}
