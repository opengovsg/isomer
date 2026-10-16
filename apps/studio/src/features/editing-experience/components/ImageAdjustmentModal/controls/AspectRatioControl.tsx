import { Box, HStack, Text } from "@chakra-ui/react"

import type { AspectRatio, CropMode } from "../AdjustmentConfig"

interface AspectRatioControlProps {
  cropMode: CropMode
  lockedRatios?: AspectRatio[]
}

// A single aspect-ratio chip in Figma's "selected toggle" look.
const RatioChip = ({ label }: { label: string }): JSX.Element => (
  <Box
    px="0.75rem"
    py="0.5rem"
    borderWidth="1.5px"
    borderColor="interaction.main.default"
    borderRadius="0.25rem"
    bgColor="interaction.main-subtle.default"
  >
    <Text textStyle="caption-1" color="base.content.strong">
      {label}
    </Text>
  </Box>
)

// The aspect-ratio indicator shown in the crop toolbar. It is display-only: our
// model fixes each component to one crop mode (fixed ratio(s) / free / none), so
// there is nothing to switch between — the chip just reports the active mode.
// "none" (preserve-only) renders nothing; the modal's preserve note covers it.
export const AspectRatioControl = ({
  cropMode,
  lockedRatios,
}: AspectRatioControlProps): JSX.Element | null => {
  if (cropMode === "none") return null

  const chips =
    cropMode === "fixed" && lockedRatios?.length
      ? lockedRatios.map((r) => `${r.width}:${r.height}`)
      : ["Custom"]

  return (
    <HStack spacing="0.75rem" align="center">
      <Text
        textStyle="caption-1"
        textTransform="uppercase"
        letterSpacing="0.05em"
        color="base.content.medium"
      >
        Aspect ratio
      </Text>
      {chips.map((label) => (
        <RatioChip key={label} label={label} />
      ))}
    </HStack>
  )
}
