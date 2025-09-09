import type { Meta, StoryObj } from "@storybook/react"

import type { NativeSearchableTableProps } from "~/interfaces"
import { NativeSearchableTable } from "./NativeSearchableTable"

const meta: Meta<NativeSearchableTableProps> = {
  title: "Next/Components/SearchableTable/Native",
  component: NativeSearchableTable,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof NativeSearchableTable>

export const Default: Story = {
  args: {
    title: "This is the title",
    headers: ["Header", "Header", "Header", "Header"],
    items: [
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
    ],
  },
}

export const TitleUndefined: Story = {
  name: "Title (Undefined)",
  args: {
    headers: ["Header", "Header", "Header", "Header"],
    items: [
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
    ],
  },
}

export const TitleEmptyString: Story = {
  name: "Title (Empty String)",
  args: {
    title: "",
    headers: ["Header", "Header", "Header", "Header"],
    items: [
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
    ],
  },
}
