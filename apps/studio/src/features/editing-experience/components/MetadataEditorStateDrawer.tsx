import type { IsomerSchema, schema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { Box, Flex, Heading, HStack, Icon, IconButton } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { getLayoutMetadataSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import { BiDollar, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import FormBuilder from "./form-builder/FormBuilder"

const ajv = new Ajv({ strict: false, logger: false })

export default function MetadataEditorStateDrawer(): JSX.Element {
  const { pageId, siteId } = useQueryParse(editPageSchema)
  const utils = trpc.useUtils()
  const [{ content: pageContent }] = trpc.page.readPageAndBlob.useSuspenseQuery(
    { siteId, pageId },
  )
  const { mutate, isLoading } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
    },
  })
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

  const metadataSchema = getLayoutMetadataSchema(previewPageState.layout)
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
    <>
      <Flex
        flexDir="column"
        position="relative"
        h="100%"
        w="100%"
        overflow="auto"
      >
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
              isDisabled={isLoading}
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
      </Flex>

      <Box
        pos="sticky"
        bottom={0}
        bgColor="base.canvas.default"
        boxShadow="md"
        py="1.5rem"
        px="2rem"
      >
        <Button
          w="100%"
          isLoading={isLoading}
          onClick={() => {
            setSavedPageState(previewPageState)
            mutate(
              {
                pageId,
                siteId,
                content: JSON.stringify(previewPageState),
              },
              {
                onSuccess: () => setDrawerState({ state: "root" }),
              },
            )
          }}
        >
          Save changes
        </Button>
      </Box>
    </>
  )
}
