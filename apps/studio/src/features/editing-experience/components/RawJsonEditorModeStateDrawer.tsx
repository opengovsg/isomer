import type { IsomerSchema } from "@opengovsg/isomer-components"
import { useCallback, useMemo, useState } from "react"
import {
  Box,
  Heading,
  HStack,
  Icon,
  Spacer,
  Textarea,
  useClipboard,
  useDisclosure,
} from "@chakra-ui/react"
import { Button, IconButton, useToast } from "@opengovsg/design-system-react"
import { schema } from "@opengovsg/isomer-components"
import isEqual from "lodash/isEqual"
import { BiDollar, BiX } from "react-icons/bi"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ajv } from "~/utils/ajv"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import { CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE } from "./constants"
import { DiscardChangesModal } from "./DiscardChangesModal"

const validateFn = ajv.compile<IsomerSchema>(schema)

export default function RawJsonEditorModeStateDrawer(): JSX.Element {
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()
  const { pageId, siteId } = useQueryParse(editPageSchema)
  const toast = useToast()
  const [pendingChanges, setPendingChanges] = useState(
    JSON.stringify(savedPageState, null, 2),
  )
  const { onCopy, hasCopied } = useClipboard(pendingChanges)

  const utils = trpc.useUtils()
  const { mutate, isLoading } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      await utils.page.readPage.invalidate({ pageId, siteId })
      toast({
        title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const handleSaveChanges = useCallback(() => {
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
  }, [
    mutate,
    pageId,
    previewPageState,
    setDrawerState,
    setSavedPageState,
    siteId,
  ])

  const handleChange = (data: string) => {
    setPendingChanges(data)
    const parsedPendingChanges = safeJsonParse(data) as unknown

    if (validateFn(parsedPendingChanges)) {
      setPreviewPageState(parsedPendingChanges)
    }
  }

  const isPendingChangesValid = useMemo(() => {
    return validateFn(safeJsonParse(pendingChanges))
  }, [pendingChanges])

  const handleDiscardChanges = () => {
    setPreviewPageState(savedPageState)
    onDiscardChangesModalClose()
    setDrawerState({ state: "root" })
  }

  return (
    <>
      <DiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        onClose={onDiscardChangesModalClose}
        onDiscard={handleDiscardChanges}
      />

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
                Raw JSON Editor Mode
              </Heading>
            </HStack>
            <Spacer />
            <Button onClick={onCopy} variant="clear">
              {!hasCopied ? "Copy to clipboard" : "Copied!"}
            </Button>
            <IconButton
              icon={<Icon as={BiX} />}
              variant="clear"
              colorScheme="sub"
              size="sm"
              p="0.625rem"
              onClick={() => {
                if (!isEqual(previewPageState, savedPageState)) {
                  onDiscardChangesModalOpen()
                } else {
                  handleDiscardChanges()
                }
              }}
              aria-label="Close drawer"
            />
          </HStack>
        </Box>

        <Box px="2rem" py="1rem" maxW="33vw" overflow="auto">
          <Textarea
            fontFamily="monospace"
            boxSizing="border-box"
            minH="68vh"
            value={pendingChanges}
            onChange={(e) => handleChange(e.target.value)}
          />
        </Box>

        <Box bgColor="base.canvas.default" boxShadow="md" py="1.5rem" px="2rem">
          <Button
            w="100%"
            isLoading={isLoading}
            isDisabled={!isPendingChangesValid}
            onClick={handleSaveChanges}
          >
            Save changes
          </Button>
        </Box>
      </Box>
    </>
  )
}
