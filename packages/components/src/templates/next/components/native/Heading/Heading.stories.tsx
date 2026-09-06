import type { Meta, StoryObj } from "@storybook/react-vite"
import type { AttrsDirProps, HeadingProps } from "~/interfaces"
import { HeadingLevels } from "~/interfaces/native/Heading"
import { generateSiteConfig } from "~/stories/helpers"

import { Heading } from "./Heading"

const meta: Meta<typeof Heading> = {
  argTypes: {},
  component: Heading,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Heading",
}
export default meta

const DefaultHeadings = () => 
  (
    <div>
      {HeadingLevels.map((level) => 
        (
          <div key={level} className="mb-4">
            <Heading
              attrs={{ level }}
              content={[{ text: `This is a heading-${level}`, type: "text" }]}
              site={generateSiteConfig()}
              headingLevel={2}
            />
          </div>
        )
      )}
    </div>
  )


export const ColorsAndVariants: StoryObj<HeadingProps> = {
  render: () => <DefaultHeadings />,
}

const HeadingsWithDirection = () => 
  (
    <div>
      {["auto", "ltr", "rtl", null, undefined].map((dir) => 
        (
          <div key={String(dir)} className="mb-4">
            <Heading
              // SAFETY: Story exercises heading dir attrs including invalid runtime values.
              attrs={{ dir: dir as AttrsDirProps, level: 2 }}
              content={[{ text: `ما ${dir} فائدته ؟`, type: "text" }]}
              site={generateSiteConfig()}
              headingLevel={2}
            />
          </div>
        )
      )}
    </div>
  )


export const HeadingsWithDirections: StoryObj<HeadingProps> = {
  render: () => <HeadingsWithDirection />,
}
