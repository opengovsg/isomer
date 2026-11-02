"use client"

import type { ImageClientWithAdjustmentProps } from "~/interfaces"
import { forwardRef } from "react"
import { getFocalObjectPosition } from "~/utils/getFocalObjectPosition"

import { ImageClient } from "./ImageClient"

// Precomputes objectPosition from imageAdjustment so ImageClient itself stays
// a dumb primitive that only ever accepts a resolved CSS position string.
export const ImageClientWithAdjustment = forwardRef<
  HTMLImageElement,
  Omit<ImageClientWithAdjustmentProps, "ref">
>(({ imageAdjustment, ...rest }, ref) => (
  <ImageClient
    ref={ref}
    {...rest}
    objectPosition={getFocalObjectPosition(imageAdjustment)}
  />
))
