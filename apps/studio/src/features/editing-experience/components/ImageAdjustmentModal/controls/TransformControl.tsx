import { HStack, Text } from "@chakra-ui/react"
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

// Uppercase group caption (Figma "ROTATE" / "FLIP"), sized to sit inline with
// the 40x40 icon buttons.
const GroupLabel = ({ children }: { children: string }): JSX.Element => (
  <Text
    textStyle="caption-1"
    textTransform="uppercase"
    letterSpacing="0.05em"
    color="base.content.medium"
  >
    {children}
  </Text>
)

// Rotate (in 90° steps) and flip controls, laid out as two labelled groups in a
// single toolbar row (sits under the crop canvas). The baking for all of these
// already exists (imageBake rotates/flips then crops); this is purely the UI. It
// emits intents ("cw"/"ccw", "h"/"v") rather than absolute values so the modal
// can move the crop + focal with the image content in the same step. Flip
// buttons are toggles — their pressed state mirrors the current draft value.
export const TransformControl = ({
  flipH,
  flipV,
  rotateDisabled = false,
  onRotate,
  onFlip,
}: TransformControlProps): JSX.Element => {
  return (
    <HStack spacing="1.5rem" align="center">
      <HStack spacing="0.5rem" align="center">
        <GroupLabel>Rotate</GroupLabel>
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
      </HStack>

      <HStack spacing="0.5rem" align="center">
        <GroupLabel>Flip</GroupLabel>
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
    </HStack>
  )
}
