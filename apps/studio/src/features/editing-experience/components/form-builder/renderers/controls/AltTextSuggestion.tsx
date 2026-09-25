import { Box, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { BiSolidMagicWand } from "react-icons/bi"

interface AltTextSuggestionProps {
  isGenerating: boolean
  suggestion?: string
  hasFailed: boolean
  onApply: () => void
  onDismiss: () => void
}

export const AltTextSuggestion = ({
  isGenerating,
  suggestion,
  hasFailed,
  onApply,
  onDismiss,
}: AltTextSuggestionProps) => {
  if (!isGenerating && !suggestion && !hasFailed) return null

  return (
    <Box
      mt="0.75rem"
      p="0.75rem"
      borderRadius="md"
      bg="base.canvas.brand-subtle"
    >
      <HStack spacing="0.5rem" align="center">
        <Icon
          as={BiSolidMagicWand}
          color="interaction.main.default"
          boxSize="1rem"
          sx={
            isGenerating
              ? {
                  animation: "altTextSparkle 1.2s ease-in-out infinite",
                  "@keyframes altTextSparkle": {
                    "0%, 100%": {
                      opacity: 1,
                      transform: "scale(1) rotate(0deg)",
                    },
                    "50%": {
                      opacity: 0.55,
                      transform: "scale(1.15) rotate(-12deg)",
                    },
                  },
                }
              : undefined
          }
        />
        <Text textStyle="subhead-2" color="interaction.main.default">
          {isGenerating
            ? "Generating alternate text…"
            : hasFailed
              ? "Couldn’t generate alternate text"
              : "Suggested alternate text"}
        </Text>
      </HStack>

      {suggestion && (
        <VStack align="stretch" spacing="0.5rem" pt="0.5rem">
          <Text textStyle="body-2">{suggestion}</Text>
          <Text textStyle="caption-2" color="base.content.medium">
            AI can make mistakes. Please review before using.
          </Text>
          <HStack spacing="0.5rem">
            <Button size="xs" onClick={onApply}>
              Use this text
            </Button>
            <Button size="xs" variant="clear" onClick={onDismiss}>
              Dismiss
            </Button>
          </HStack>
        </VStack>
      )}

      {hasFailed && (
        <VStack align="stretch" spacing="0.5rem" pt="0.5rem">
          <Text textStyle="body-2" color="base.content.medium">
            The image was saved. Write the alternate text yourself, or upload
            the image again to retry.
          </Text>
          <Box>
            <Button size="xs" variant="clear" onClick={onDismiss}>
              Dismiss
            </Button>
          </Box>
        </VStack>
      )}
    </Box>
  )
}
