import { HStack, Spinner, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

interface AltTextSuggestionProps {
  isGenerating: boolean
  suggestion?: string
  onApply: () => void
  onDismiss: () => void
}

export const AltTextSuggestion = ({
  isGenerating,
  suggestion,
  onApply,
  onDismiss,
}: AltTextSuggestionProps) => {
  if (isGenerating) {
    return (
      <HStack spacing="0.5rem" pt="0.75rem">
        <Spinner size="sm" color="interaction.main.default" />
        <Text textStyle="body-2" color="base.content.medium">
          Generating alternate text…
        </Text>
      </HStack>
    )
  }

  if (!suggestion) return null

  return (
    <VStack align="stretch" spacing="0.5rem" pt="0.75rem">
      <Text textStyle="body-2" color="base.content.medium">
        Suggested alternate text
      </Text>
      <Text textStyle="body-2">{suggestion}</Text>
      <HStack spacing="0.5rem">
        <Button size="xs" onClick={onApply}>
          Use this text
        </Button>
        <Button size="xs" variant="clear" onClick={onDismiss}>
          Dismiss
        </Button>
      </HStack>
    </VStack>
  )
}
