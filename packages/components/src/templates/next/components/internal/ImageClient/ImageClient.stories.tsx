import type { Meta, StoryObj } from "@storybook/react-vite"

import { ImageClient } from "./ImageClient"

const meta: Meta<typeof ImageClient> = {
  title: "Next/Internal Components/ImageClient",
  component: ImageClient,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}

export default meta

type Story = StoryObj<typeof ImageClient>

// Default scenario without objectPosition
export const Default: Story = {
  render: () => (
    <div style={{ width: "320px", height: "160px", overflow: "hidden" }}>
      <ImageClient
        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop"
        alt="Sample image"
        width="400"
        className="h-full w-full"
      />
    </div>
  ),
}

// With objectPosition for focal-point rendering
export const WithObjectPosition: Story = {
  render: () => (
    <div style={{ width: "320px", height: "160px", overflow: "hidden" }}>
      <ImageClient
        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop"
        alt="Sample image with focal point"
        width="400"
        className="h-full w-full object-cover"
        objectPosition="25% 75%"
      />
    </div>
  ),
}
