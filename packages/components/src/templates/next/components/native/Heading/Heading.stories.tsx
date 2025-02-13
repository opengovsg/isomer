import type { Meta, StoryObj } from "@storybook/react"

import type { AttrsDirProps, HeadingProps } from "~/interfaces"
import { HeadingLevels } from "~/interfaces/native/Heading"
import Heading from "./Heading"

const meta: Meta<typeof Heading> = {
  title: "Next/Components/Heading",
  component: Heading,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta

const DefaultHeadings = () => {
  return (
    <div>
      {HeadingLevels.map((level) => {
        return (
          <div className="mb-4">
            <Heading
              attrs={{ level }}
              content={[{ type: "text", text: `This is a heading-${level}` }]}
              site={{
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
                logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
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
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export const ColorsAndVariants: StoryObj<HeadingProps> = {
  render: () => <DefaultHeadings />,
}

const HeadingsWithDirection = () => {
  return (
    <div>
      {["auto", "ltr", "rtl", null, undefined].map((dir) => {
        return (
          <div className="mb-4">
            <Heading
              attrs={{ level: 2, dir: dir as AttrsDirProps }}
              content={[{ type: "text", text: `ما ${dir} فائدته ؟` }]}
              site={{
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
                logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
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
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export const HeadingsWithDirections: StoryObj<HeadingProps> = {
  render: () => <HeadingsWithDirection />,
}
