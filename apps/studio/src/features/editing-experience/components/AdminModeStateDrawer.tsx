import { useState } from "react"
import { Box, Heading, HStack, Icon, Spacer, Text } from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { BiDollar, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"

export default function AdminModeStateDrawer(): JSX.Element {
  const { savedPageState, setDrawerState } = useEditorDrawerContext()
  const [isCopiedToClipboard, setIsCopiedToClipboard] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(savedPageState, null, 2))
    setIsCopiedToClipboard(true)
    setTimeout(() => {
      setIsCopiedToClipboard(false)
    }, 2000)
  }

  return (
    <Box h="100%" w="100%" overflow="auto">
      <Box
        bgColor="base.canvas.default"
        borderBottomColor="base.divider.medium"
        borderBottomWidth="1px"
        px="2rem"
        py="1.25rem"
      >
        <HStack justifyContent="start" w="100%">
          <HStack spacing={3}>
            <Icon
              as={BiDollar}
              fontSize="1.5rem"
              p="0.25rem"
              bgColor="slate.100"
              textColor="blue.600"
              borderRadius="base"
            />
            <Heading as="h3" size="sm" textStyle="h5" fontWeight="semibold">
              Admin Mode
            </Heading>
          </HStack>
          <Spacer />
          <Button onClick={handleCopy} variant="clear">
            {!isCopiedToClipboard ? "Copy to clipboard" : "Copied!"}
          </Button>
          <IconButton
            icon={<Icon as={BiX} />}
            variant="clear"
            colorScheme="sub"
            size="sm"
            p="0.625rem"
            onClick={() => {
              setDrawerState({ state: "root" })
            }}
            aria-label="Close drawer"
          />
        </HStack>
      </Box>

      <Box px="2rem" py="1rem" maxW="33vw" overflow="auto">
        <Text as="pre">{JSON.stringify(savedPageState, null, 2)}</Text>
      </Box>
    </Box>
  )
}
