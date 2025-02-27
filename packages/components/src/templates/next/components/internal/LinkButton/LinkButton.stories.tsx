import type { Meta, StoryObj } from "@storybook/react"

import { LinkButton } from "./LinkButton"

const meta: Meta<typeof LinkButton> = {
  title: "Next/Internal Components/LinkButton",
  component: LinkButton,
  render: (args) => {
    // Define matrices for link types and sizes
    const links = ["/", "https://www.google.com"] as const
    const sizes = ["base", "lg"] as const

    // Generate all combinations
    const combinations = sizes.flatMap((size) =>
      links.map((link) => ({ size, link })),
    )

    return (
      <div className="flex flex-col gap-2">
        {combinations.map((combo, index) => (
          <div key={index}>
            <LinkButton {...args} size={combo.size} href={combo.link} />
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
type Story = StoryObj<typeof LinkButton>

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
