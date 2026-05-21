import { HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { BiSolidErrorCircle } from "react-icons/bi"

interface DuplicateLabelErrorProps {
  /** Singular noun, e.g. "filter" or "option" */
  noun: string
}

export function DuplicateLabelError({ noun }: DuplicateLabelErrorProps) {
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1)
  return (
    <HStack align="start" gap="0.5rem" mt="0.5rem" w="100%">
      <Icon
        as={BiSolidErrorCircle}
        fontSize="1rem"
        color="utility.feedback.critical"
        mt="0.125rem"
        flexShrink={0}
      />
      <VStack align="start" spacing={0}>
        <Text textStyle="subhead-2" color="utility.feedback.critical">
          Remove duplicate {noun}s before saving.
        </Text>
        <Text textStyle="body-2" color="utility.feedback.critical">
          {Noun} names are not case-sensitive.
        </Text>
      </VStack>
    </HStack>
  )
}
