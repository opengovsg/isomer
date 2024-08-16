import type { IsomerComponent } from "@opengovsg/isomer-components"
import {
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  useDisclosure,
} from "@chakra-ui/react"
import { Button, IconButton, useToast } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import _ from "lodash"
import { BiDollar, BiTrash, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import { DeleteBlockModal } from "./DeleteBlockModal"
import { DiscardChangesModal } from "./DiscardChangesModal"
import FormBuilder from "./form-builder/FormBuilder"

const ajv = new Ajv({ strict: false, logger: false })

export default function ComplexEditorStateDrawer(): JSX.Element {
  const {
    isOpen: isDeleteBlockModalOpen,
    onOpen: onDeleteBlockModalOpen,
    onClose: onDeleteBlockModalClose,
  } = useDisclosure()
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const {
    setDrawerState,
    currActiveIdx,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
    modifiedAssets,
    setModifiedAssets,
  } = useEditorDrawerContext()
  const toast = useToast()

  const { pageId, siteId } = useQueryParse(editPageSchema)
  const utils = trpc.useUtils()

  const { mutate: savePage, isLoading: isSavingPage } =
    trpc.page.updatePageBlob.useMutation({
      onSuccess: async () => {
        await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      },
    })

  const { mutateAsync: uploadAsset, isLoading: isUploadingAsset } =
    useUploadAssetMutation({ siteId })

  if (
    currActiveIdx === -1 ||
    !previewPageState ||
    !savedPageState ||
    currActiveIdx > previewPageState.content.length
  ) {
    return <></>
  }

  const component = previewPageState.content[currActiveIdx]

  if (!component) {
    return <></>
  }

  const subSchema = getComponentSchema(component.type)
  const { title } = subSchema
  const validateFn = ajv.compile<IsomerComponent>(subSchema)
  const componentName = title || "component"

  const handleDeleteBlock = () => {
    const updatedBlocks = Array.from(savedPageState.content)
    updatedBlocks.splice(currActiveIdx, 1)
    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    setSavedPageState(newPageState)
    setPreviewPageState(newPageState)
    onDeleteBlockModalClose()
    setDrawerState({ state: "root" })
  }

  const handleDiscardChanges = () => {
    setPreviewPageState(savedPageState)
    onDiscardChangesModalClose()
    setDrawerState({ state: "root" })
  }

  const handleChange = (data: IsomerComponent) => {
    const updatedBlocks = Array.from(previewPageState.content)
    updatedBlocks[currActiveIdx] = data
    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    setPreviewPageState(newPageState)
  }

  const handleSave = async () => {
    let newPageState = previewPageState

    if (modifiedAssets.length > 0) {
      const updatedBlocks = Array.from(previewPageState.content)
      const newBlock = _.cloneDeep(updatedBlocks[currActiveIdx])

      if (!newBlock) {
        return
      }

      // Upload all new/modified images/files
      const assetsToUpload = modifiedAssets.filter((asset) => !!asset.file)

      const isUploadingSuccessful = await Promise.allSettled(
        assetsToUpload.map(({ path, file }) => {
          if (!file) {
            return
          }

          return uploadAsset({ file }).then((res) => {
            _.set(newBlock, path, res.path)
            return path
          })
        }),
      ).then((results) => {
        // Keep only failed uploads inside modifiedAssets so on subsequent
        // save attempts, we retry uploading just the failed assets
        const newModifiedAssets = modifiedAssets.filter(({ path }) => {
          return !results.some(
            (result) => result.status === "fulfilled" && result.value === path,
          )
        })

        if (newModifiedAssets.length > 0) {
          const failedUploadsCount = newModifiedAssets.length
          const totalUploadsCount = modifiedAssets.length

          toast({
            title: "Error uploading assets",
            description: `An error occurred while uploading ${failedUploadsCount}/${totalUploadsCount} files/images. Please try again later.`,
            status: "error",
          })

          setModifiedAssets(newModifiedAssets)
          return false
        }

        return true
      })

      // TODO: Mark removed images/files as deleted
      // const assetsToDelete = modifiedAssets.filter((asset) => !asset.file)

      updatedBlocks[currActiveIdx] = newBlock
      newPageState = {
        ...previewPageState,
        content: updatedBlocks,
      }

      if (!isUploadingSuccessful) {
        // NOTE: Do not save page if there are errors uploading assets
        setPreviewPageState(newPageState)
        return
      }
    }

    savePage(
      {
        pageId,
        siteId,
        content: JSON.stringify(newPageState),
      },
      {
        onSuccess: () => {
          setModifiedAssets([])
          setSavedPageState(newPageState)
          setDrawerState({ state: "root" })
        },
      },
    )
  }

  return (
    <>
      <DeleteBlockModal
        itemName={componentName}
        isOpen={isDeleteBlockModalOpen}
        onClose={onDeleteBlockModalClose}
        onDelete={handleDeleteBlock}
      />

      <DiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        onClose={onDiscardChangesModalClose}
        onDiscard={handleDiscardChanges}
      />

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
            <HStack spacing="0.75rem">
              <Icon
                as={BiDollar}
                fontSize="1.5rem"
                p="0.25rem"
                bgColor="slate.100"
                textColor="blue.600"
                borderRadius="base"
              />
              <Heading as="h3" size="sm" textStyle="h5" fontWeight="semibold">
                Edit {componentName}
              </Heading>
            </HStack>
            <IconButton
              icon={<Icon as={BiX} />}
              variant="clear"
              colorScheme="sub"
              size="sm"
              p="0.625rem"
              isDisabled={isSavingPage || isUploadingAsset}
              onClick={() => {
                if (!_.isEqual(previewPageState, savedPageState)) {
                  onDiscardChangesModalOpen()
                } else {
                  handleDiscardChanges()
                }
              }}
              aria-label="Close drawer"
            />
          </HStack>
        </Box>

        <Box px="2rem" py="1rem">
          <FormBuilder<IsomerComponent>
            schema={subSchema}
            validateFn={validateFn}
            data={component}
            handleChange={handleChange}
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
        <HStack spacing="0.75rem">
          <IconButton
            icon={<BiTrash fontSize="1.25rem" />}
            variant="outline"
            colorScheme="critical"
            aria-label="Delete block"
            onClick={onDeleteBlockModalOpen}
          />
          <Box w="100%">
            <Button
              w="100%"
              onClick={handleSave}
              isLoading={isSavingPage || isUploadingAsset}
            >
              Save changes
            </Button>
          </Box>
        </HStack>
      </Box>
    </>
  )
}
