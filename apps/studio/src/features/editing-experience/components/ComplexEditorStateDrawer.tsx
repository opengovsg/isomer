import { Box, Heading, HStack, Icon } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { BiDollar, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import FormBuilder from "./form-builder/FormBuilder"

export default function ComplexEditorStateDrawer(): JSX.Element {
  const { addedBlock: component } = useEditorDrawerContext()

  return (
    <Box position="relative" h="100%" w="100%">
      <Box
        bgColor="base.canvas.default"
        borderBottomColor="base.divider.medium"
        borderBottomWidth="1px"
        px="2rem"
        py="1.25rem"
      >
        <HStack justifyContent="space-between" w="100%">
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
              {/* TODO: Replace this with the actual component name */}
              Edit Infocols
            </Heading>
          </HStack>
          <IconButton
            icon={<Icon as={BiX} />}
            variant="clear"
            colorScheme="sub"
            size="sm"
            p="0.625rem"
            onClick={() => console.log("Close drawer")}
            aria-label="Close drawer"
          />
        </HStack>
      </Box>
      <Box px="2rem" py="1.5rem">
        <FormBuilder component="infocols" />
      </Box>
    </Box>
  )
}
