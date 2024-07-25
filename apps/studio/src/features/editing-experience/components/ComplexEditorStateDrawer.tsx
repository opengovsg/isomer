import type { IsomerComponent } from "@opengovsg/isomer-components"
import { Box, Heading, HStack, Icon } from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { BiDollar, BiX } from "react-icons/bi"
import z from "zod"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import FormBuilder from "./form-builder/FormBuilder"

const complexEditorSchema = z.object({
  pageId: z.coerce.number(),
  siteId: z.coerce.number(),
})

interface ComplexEditorStateDrawerProps {
  component: IsomerComponent
}

const ComplexEditorStateDrawer = ({
  component,
}: ComplexEditorStateDrawerProps) => {
  const { pageId, siteId } = useQueryParse(complexEditorSchema)
  const [{ content: pageContent }] = trpc.page.readPageAndBlob.useSuspenseQuery(
    { siteId, pageId },
  )
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()
  const { title } = getComponentSchema(component.type)
  const utils = trpc.useUtils()

  const { mutate, isLoading } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
    },
  })

  return (
    <Box position="relative" h="100%" w="100%" overflow="auto">
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
              Edit {title}
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
        <FormBuilder />
      </Box>
      <Box px="2rem" pb="1.5rem">
        <Button
          w="100%"
          onClick={() => {
            setDrawerState({ state: "root" })
            setSavedPageState(previewPageState)
            mutate({
              pageId,
              siteId,
              content: JSON.stringify({
                ...pageContent,
                content: previewPageState,
              }),
            })
          }}
          isLoading={isLoading}
        >
          Save
        </Button>
      </Box>
    </Box>
  )
}

export default function ComplexEditorStateDrawerContainer(): JSX.Element {
  const { currActiveIdx, savedPageState, previewPageState } =
    useEditorDrawerContext()
  if (currActiveIdx === -1 || currActiveIdx > savedPageState.length) {
    return <></>
  }

  const component = previewPageState[currActiveIdx]

  if (!component) {
    return <></>
  }

  return <ComplexEditorStateDrawer component={component} />
}
