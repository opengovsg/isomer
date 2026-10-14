import { HStack, Text, VStack } from "@chakra-ui/react"
import { IconButton, Tooltip } from "@opengovsg/design-system-react"
import {
  BiReflectHorizontal,
  BiReflectVertical,
  BiRotateLeft,
  BiRotateRight,
} from "react-icons/bi"

type Rotation = 0 | 90 | 180 | 270

interface TransformControlProps {
  rotate: Rotation
  flipH: boolean
  flipV: boolean
  onRotateChange: (rotate: Rotation) => void
  onFlipHChange: (flipH: boolean) => void
  onFlipVChange: (flipV: boolean) => void
}

// Normalize any multiple of 90 back into the 0|90|180|270 domain, including the
// negative values produced by rotating left (e.g. 0 − 90 = −90 → 270).
export const normalizeRotation = (deg: number): Rotation =>
  (((deg % 360) + 360) % 360) as Rotation

// Rotate (in 90° steps) and flip controls. The baking for all of these already
// exists (imageBake applies crop → rotate → flip); this is purely the UI that
// writes draft.rotate/flipH/flipV. Flip buttons are toggles — their pressed
// state mirrors the current draft value.
export const TransformControl = ({
  rotate,
  flipH,
  flipV,
  onRotateChange,
  onFlipHChange,
  onFlipVChange,
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
            onClick={() => onRotateChange(normalizeRotation(rotate - 90))}
          />
        </Tooltip>
        <Tooltip label="Rotate right">
          <IconButton
            variant="outline"
            colorScheme="neutral"
            aria-label="Rotate right"
            icon={<BiRotateRight />}
            onClick={() => onRotateChange(normalizeRotation(rotate + 90))}
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
            onClick={() => onFlipHChange(!flipH)}
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
            onClick={() => onFlipVChange(!flipV)}
          />
        </Tooltip>
      </HStack>
    </VStack>
  )
}
