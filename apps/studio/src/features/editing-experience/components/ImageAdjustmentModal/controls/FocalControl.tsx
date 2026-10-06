"use client"

import type { CSSProperties } from "react"
import { Box, Text, VStack } from "@chakra-ui/react"
import { useRef, useState } from "react"

import { pointToFocal } from "./focalGeometry"

interface FocalControlProps {
  src: string
  focal?: { x: number; y: number }
  onChange: (focal: { x: number; y: number }) => void
}

export const FocalControl = ({
  src,
  focal,
  onChange,
}: FocalControlProps): JSX.Element => {
  const boxRef = useRef<HTMLDivElement>(null)
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined)
  const [isDragging, setIsDragging] = useState(false)

  const currentFocal = focal ?? { x: 0.5, y: 0.5 }

  // When image loads, read its natural aspect ratio to prevent letterboxing
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setAspectRatio(img.naturalWidth / img.naturalHeight)
    }
  }

  // Update focal point from pointer coordinates
  const updateFocal = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!boxRef.current) return

    const rect = boxRef.current.getBoundingClientRect()
    const newFocal = pointToFocal(event.clientX, event.clientY, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    })

    onChange(newFocal)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!boxRef.current) return
    setIsDragging(true)
    boxRef.current.setPointerCapture(event.pointerId)
    updateFocal(event)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    updateFocal(event)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (boxRef.current) {
      boxRef.current.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
  }

  const markerStyle: CSSProperties = {
    position: "absolute",
    left: `${currentFocal.x * 100}%`,
    top: `${currentFocal.y * 100}%`,
    transform: "translate(-50%, -50%)",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    backgroundColor: "white",
    border: "2px solid #0066cc",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    cursor: isDragging ? "grabbing" : "grab",
    pointerEvents: "none",
    zIndex: 10,
  }

  return (
    <VStack align="start" spacing="0.5rem" w="100%">
      <Text textStyle="h6" fontWeight="semibold">
        Focal point
      </Text>
      <Text textStyle="body-2" color="base.content.medium">
        Drag to choose the part of the image to keep in view
      </Text>

      <Box
        ref={boxRef}
        position="relative"
        w="100%"
        maxH="20rem"
        aspectRatio={aspectRatio}
        borderWidth="1px"
        borderColor="base.divider.medium"
        borderRadius="0.25rem"
        overflow="hidden"
        backgroundColor="base.canvas.neutral"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        cursor={isDragging ? "grabbing" : "grab"}
      >
        {/* oxlint-disable-next-line @next/next/no-img-element -- needs naturalWidth/Height for the no-letterbox aspect mapping; user image, not an LCP hero */}
        <img
          src={src}
          alt="Image for focal point adjustment"
          onLoad={handleImageLoad}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {/* Focal point marker */}
        <div style={markerStyle} />
      </Box>
    </VStack>
  )
}
