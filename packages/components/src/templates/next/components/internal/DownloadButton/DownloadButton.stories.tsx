import type { Meta, StoryObj } from "@storybook/react-vite"

import { DownloadButton } from "./DownloadButton"

const meta: Meta<typeof DownloadButton> = {
  argTypes: {
    colorScheme: {
      control: {
        type: "select",
      },
      options: ["default", "inverse"],
    },
    variant: {
      control: {
        type: "select",
      },
      options: ["solid", "outline"],
    },
  },
  component: DownloadButton,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  render: (args) => {
    // Define matrices for link types and sizes
    const links = ["/sample-file.pdf"] as const
    const sizes = ["sm", "base", "lg"] as const

    // Generate all combinations
    const combinations = sizes.flatMap((size) =>
      links.map((link) => ({ link, size })),
    )

    return (
      <div className="flex flex-col gap-2">
        {combinations.map((combo) => (
          <div key={`${combo.size}-${combo.link}`}>
            <DownloadButton
              {...args}
              size={combo.size}
              url={args.url || combo.link}
            />
          </div>
        ))}
      </div>
    )
  },
  title: "Next/Internal Components/DownloadButton",
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
  args: {
    ...Default.args,
    colorScheme: "inverse",
  },
  decorators: [
    (storyFn) => <div className="bg-base-canvas-inverse p-6">{storyFn()}</div>,
  ],
}

export const InverseOutlineVariant: Story = {
  args: {
    ...OutlineVariant.args,
    colorScheme: "inverse",
  },
  decorators: InverseDefaultVariant.decorators,
}

export const DgsLink: Story = {
  args: {
    ...Default.args,
    url: "[dgs:d_688b934f82c1059ed0a6993d2a829089]",
  },
  name: "Download DGS Button",
}
