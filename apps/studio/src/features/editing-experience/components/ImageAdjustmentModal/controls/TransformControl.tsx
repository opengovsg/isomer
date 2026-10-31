import { HStack, Text, VStack } from "@chakra-ui/react"
import { IconButton, Tooltip } from "@opengovsg/design-system-react"
import {
  BiReflectHorizontal,
  BiReflectVertical,
  BiRotateLeft,
  BiRotateRight,
} from "react-icons/bi"

interface TransformControlProps {
  flipH: boolean
  flipV: boolean
  // Rotation re-derives a locked-ratio crop, which needs the real image aspect;
  // disable it until the image has loaded so a square-assumed crop can't be
  // baked. Flips never need it (they just mirror the existing rect).
  rotateDisabled?: boolean
  onRotate: (direction: "cw" | "ccw") => void
  onFlip: (axis: "h" | "v") => void
}

// Rotate (in 90° steps) and flip controls. The baking for all of these already
// exists (imageBake rotates/flips then crops); this is purely the UI. It emits
// intents ("cw"/"ccw", "h"/"v") rather than absolute values so the modal can
// move the crop + focal with the image content in the same step. Flip buttons
// are toggles — their pressed state mirrors the current draft value.
export const TransformControl = ({
  flipH,
  flipV,
  rotateDisabled = false,
  onRotate,
  onFlip,
}: TransformControlProps): JSX.Element => {
  return (
    <VStack align="start" spacing="0.5rem" w="100%">
      <Text textStyle="h6" fontWeight="semibold">
        Rotate & flip
      </Text>
      <HStack spacing="0.5rem">
        <Tooltip label="Rotate left">
          <IconButton
            variant="outline"
            colorScheme="neutral"
            aria-label="Rotate left"
            icon={<BiRotateLeft />}
            isDisabled={rotateDisabled}
            onClick={() => onRotate("ccw")}
          />
        </Tooltip>
        <Tooltip label="Rotate right">
          <IconButton
            variant="outline"
            colorScheme="neutral"
            aria-label="Rotate right"
            icon={<BiRotateRight />}
            isDisabled={rotateDisabled}
            onClick={() => onRotate("cw")}
          />
        </Tooltip>
        <Tooltip label="Flip horizontal">
          <IconButton
            variant="outline"
            colorScheme="neutral"
            aria-label="Flip horizontal"
            aria-pressed={flipH}
            isActive={flipH}
            icon={<BiReflectVertical />}
            onClick={() => onFlip("h")}
          />
        </Tooltip>
        <Tooltip label="Flip vertical">
          <IconButton
            variant="outline"
            colorScheme="neutral"
            aria-label="Flip vertical"
            aria-pressed={flipV}
            isActive={flipV}
            icon={<BiReflectHorizontal />}
            onClick={() => onFlip("v")}
          />
        </Tooltip>
      </HStack>
    </VStack>
  )
}
