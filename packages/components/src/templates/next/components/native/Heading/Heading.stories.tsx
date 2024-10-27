import type { Meta, StoryObj } from "@storybook/react"

import type { HeadingProps } from "~/interfaces"
import { HeadingLevels } from "~/interfaces/native/Heading"
import { ISOMER_PAGE_LAYOUTS } from "~/types"
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

const Headings = () => {
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
                  layout: ISOMER_PAGE_LAYOUTS.Homepage,
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
  render: () => <Headings />,
}
