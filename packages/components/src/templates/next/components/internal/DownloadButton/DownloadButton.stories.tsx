import type { Meta, StoryObj } from "@storybook/react"

import { DownloadButton } from "./DownloadButton"

const meta: Meta<typeof DownloadButton> = {
  title: "Next/Internal Components/DownloadButton",
  component: DownloadButton,
  render: (args) => {
    // Define matrices for link types and sizes
    const links = ["/"] as const
    const sizes = ["sm", "base", "lg"] as const

    // Generate all combinations
    const combinations = sizes.flatMap((size) =>
      links.map((link) => ({ size, link })),
    )

    return (
      <div className="flex flex-col gap-2">
        {combinations.map((combo, index) => (
          <div key={index}>
            <DownloadButton {...args} size={combo.size} url={combo.link} />
          </div>
        ))}
      </div>
    )
  },
  argTypes: {
    colorScheme: {
      options: ["default", "inverse"],
      control: {
        type: "select",
      },
    },
    variant: {
      options: ["solid", "outline"],
      control: {
        type: "select",
      },
    },
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof DownloadButton>

// Default scenario
export const Default: Story = {
  args: {
    children: "Work with us",
  },
}

export const LongerButtonText: Story = {
  args: {
    children: "slightly longer (link) button text",
  },
}

export const OutlineVariant: Story = {
  args: {
    ...Default.args,
    variant: "outline",
  },
}

export const InverseDefaultVariant: Story = {
  decorators: [
    (storyFn) => <div className="bg-base-canvas-inverse p-6">{storyFn()}</div>,
  ],
  args: {
    ...Default.args,
    colorScheme: "inverse",
  },
}

export const InverseOutlineVariant: Story = {
  decorators: InverseDefaultVariant.decorators,
  args: {
    ...OutlineVariant.args,
    colorScheme: "inverse",
  },
}
