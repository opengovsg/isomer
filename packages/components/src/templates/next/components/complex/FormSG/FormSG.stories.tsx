import type { Meta, StoryObj } from "@storybook/react"

import type { FormSGProps } from "~/interfaces"
import { FormSG } from "./FormSG"

const meta: Meta<FormSGProps> = {
  title: "Next/Components/FormSG",
  component: FormSG,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof FormSG>

export const Default: Story = {
  args: {
    title: "Sample form on Isomer",
    url: "https://form.gov.sg/686e73c1a1f7bf391ee2b3af",
  },
}
