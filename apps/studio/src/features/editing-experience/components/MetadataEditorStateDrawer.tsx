import type { IsomerSchema, schema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { Box, Heading, HStack, Icon, IconButton } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { getLayoutMetadataSchema } from "@opengovsg/isomer-components"
import { type TSchema } from "@sinclair/typebox"
import Ajv from "ajv"
import { BiDollar, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import FormBuilder from "./form-builder/FormBuilder"

const ajv = new Ajv({ strict: false, logger: false })

export default function MetadataEditorStateDrawer(): JSX.Element {
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()

  if (!previewPageState) {
    return <></>
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const metadataSchema: TSchema = getLayoutMetadataSchema(
    previewPageState.layout,
  )
  const validateFn = ajv.compile<Static<typeof metadataSchema>>(metadataSchema)

  const handleChange = (data: unknown) => {
    // TODO: Perform actual validation on the data
    const newPageState = {
      ...previewPageState,
      page: data,
    } as IsomerSchema

    setPreviewPageState(newPageState)
  }

  return (
    <Box w="100%">
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
              Edit page title and summary
            </Heading>
          </HStack>
          <IconButton
            icon={<Icon as={BiX} />}
            variant="clear"
            colorScheme="sub"
            size="sm"
            p="0.625rem"
            onClick={() => {
              setPreviewPageState(savedPageState)
              setDrawerState({ state: "root" })
            }}
            aria-label="Close drawer"
          />
        </HStack>
      </Box>

      <Box px="2rem" py="1rem">
        <FormBuilder<Static<typeof schema>>
          schema={metadataSchema}
          validateFn={validateFn}
          data={previewPageState.page}
          handleChange={(data) => handleChange(data)}
        />
      </Box>

      <Box px="2rem" pb="1.5rem">
        <Button
          w="100%"
          onClick={() => {
            setDrawerState({ state: "root" })
            setSavedPageState(previewPageState)
          }}
        >
          Save
        </Button>
      </Box>
    </Box>
  )
}
