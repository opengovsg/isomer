import type { Meta, StoryObj } from "@storybook/react-vite"
import type { NativeSearchableTableProps } from "~/interfaces"

import { NativeSearchableTable } from "./NativeSearchableTable"

const meta: Meta<NativeSearchableTableProps> = {
  argTypes: {},
  component: NativeSearchableTable,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/SearchableTable/Native",
}
export default meta
type Story = StoryObj<typeof NativeSearchableTable>

export const Default: Story = {
  args: {
    headers: ["Header", "Header", "Header", "Header"],
    items: [
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
    ],
    title: "This is the title",
  },
}

export const TitleUndefined: Story = {
  args: {
    headers: ["Header", "Header", "Header", "Header"],
    items: [
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
    ],
  },
  name: "Title (Undefined)",
}

export const TitleEmptyString: Story = {
  args: {
    headers: ["Header", "Header", "Header", "Header"],
    items: [
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
      ["Cell copy", "Cell copy", "Cell copy", "Cell copy"],
    ],
    title: "",
  },
  name: "Title (Empty String)",
}
