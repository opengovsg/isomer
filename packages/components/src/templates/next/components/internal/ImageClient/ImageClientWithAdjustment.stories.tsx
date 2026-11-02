import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ImageAdjustment } from "~/interfaces/complex/Image"

import { ImageClientWithAdjustment } from "./ImageClientWithAdjustment"

const meta: Meta<typeof ImageClientWithAdjustment> = {
  title: "Next/Internal Components/ImageClientWithAdjustment",
  component: ImageClientWithAdjustment,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}

export default meta

type Story = StoryObj<typeof ImageClientWithAdjustment>

const adjustmentWithFocal = (x: number, y: number): ImageAdjustment => ({
  crop: { x: 0, y: 0, width: 1, height: 1 },
  focal: { x, y },
  rotate: 0,
  flipH: false,
  flipV: false,
  originalKey: "1/00000000-0000-0000-0000-000000000000/original.jpg",
})

// Default scenario without imageAdjustment
export const Default: Story = {
  render: () => (
    <div style={{ width: "320px", height: "160px", overflow: "hidden" }}>
      <ImageClientWithAdjustment
        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop"
        alt="Sample image"
        width="400"
        className="h-full w-full"
      />
    </div>
  ),
}

// With imageAdjustment for focal-point rendering
export const WithFocalPoint: Story = {
  render: () => (
    <div style={{ width: "320px", height: "160px", overflow: "hidden" }}>
      <ImageClientWithAdjustment
        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop"
        alt="Sample image with focal point"
        width="400"
        className="h-full w-full object-cover"
        imageAdjustment={adjustmentWithFocal(0.25, 0.75)}
      />
    </div>
  ),
}
