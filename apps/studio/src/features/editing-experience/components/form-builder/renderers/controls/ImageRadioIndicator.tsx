import type { BoxProps } from "@chakra-ui/react"
import { Box, chakra } from "@chakra-ui/react"

interface ImageRadioIndicatorProps {
  isSelected: boolean
}

export const ImageRadioIndicator = chakra(
  ({ isSelected, ...props }: ImageRadioIndicatorProps & BoxProps) => {
    return (
      <Box
        boxSize="20px"
        borderRadius="full"
        borderWidth="1.2px"
        borderColor={isSelected ? "#1361F0" : "#2C2E34"}
        bg="white"
        boxShadow="0 0 4px rgba(188, 203, 238, 0.41)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        {...props}
      >
        {isSelected && <Box boxSize="13px" borderRadius="full" bg="#1361F0" />}
      </Box>
    )
  },
)
