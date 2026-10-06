import type { ImageAdjustment } from "@opengovsg/isomer-components"
import type { Meta, StoryObj } from "@storybook/nextjs"
import { useState } from "react"

import type { AdjustmentConfig } from "./AdjustmentConfig"
import { ImageAdjustmentModal } from "./ImageAdjustmentModal"

const TIER_B_CONFIG: AdjustmentConfig = {
  componentType: "hero",
  tier: "B",
  cropMode: "fixed",
  lockedRatios: [
    { width: 16, height: 9 },
    { width: 4, height: 3 },
  ],
  focalEnabled: true,
  previewStates: [
    {
      id: "mobile",
      label: "Mobile",
      viewportWidth: 375,
      aspectRatio: { width: 4, height: 3 },
    },
    {
      id: "tablet",
      label: "Tablet",
      viewportWidth: 768,
      aspectRatio: { width: 16, height: 9 },
    },
    {
      id: "desktop",
      label: "Desktop",
      viewportWidth: 1024,
      aspectRatio: { width: 16, height: 9 },
    },
  ],
  masks: [
    {
      id: "vignette",
      label: "Vignette",
      shape: "rounded",
    },
  ],
  scrims: [
    {
      id: "gradient",
      className: "bg-gradient-to-r from-black/50 to-transparent",
    },
  ],
  preUploadCopy:
    "For best results, use images at least 1600px wide. Square images will be cropped to your selected aspect ratio.",
}

interface ImageAdjustmentModalHarnessProps {
  isOpen: boolean
  value?: ImageAdjustment
}

const ImageAdjustmentModalHarness = ({
  isOpen: initialIsOpen,
  value,
}: ImageAdjustmentModalHarnessProps) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen)
  const [savedValue, setSavedValue] = useState<ImageAdjustment | undefined>(
    value,
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ padding: "0.5rem 1rem" }}
      >
        Open Modal
      </button>
      <div
        style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}
      >
        <strong>Saved value:</strong>
        <pre>{JSON.stringify(savedValue, null, 2)}</pre>
      </div>
      <ImageAdjustmentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        config={TIER_B_CONFIG}
        src="https://images.unsplash.com/photo-1549887534-f3e6e4db3513?w=1600&h=900&fit=crop"
        value={value}
        onSave={(next) => {
          setSavedValue(next)
          setIsOpen(false)
        }}
      />
    </>
  )
}

const meta: Meta<typeof ImageAdjustmentModalHarness> = {
  title: "Features/EditingExperience/ImageAdjustmentModal",
  component: ImageAdjustmentModalHarness,
}

export default meta
type Story = StoryObj<typeof ImageAdjustmentModalHarness>

export const Empty: Story = {
  args: {
    isOpen: true,
  },
}

export const WithExistingValue: Story = {
  args: {
    isOpen: true,
    value: {
      crop: {
        x: 0.1,
        y: 0.2,
        width: 0.8,
        height: 0.6,
      },
      focal: {
        x: 0.5,
        y: 0.5,
      },
      rotate: 0,
      flipH: false,
      flipV: false,
      originalKey: "existing-key-123",
    },
  },
}
