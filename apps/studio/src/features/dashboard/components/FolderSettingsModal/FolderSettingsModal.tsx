import { Suspense, useEffect } from "react"
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  VStack,
} from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { useAtomValue, useSetAtom } from "jotai"
import { BiLink } from "react-icons/bi"

import { generateResourceUrl } from "~/features/editing-experience/components/utils"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import {
  baseEditFolderSchema,
  MAX_FOLDER_PERMALINK_LENGTH,
  MAX_FOLDER_TITLE_LENGTH,
} from "~/schemas/folder"
import { trpc } from "~/utils/trpc"
import {
  DEFAULT_FOLDER_SETTINGS_MODAL_STATE,
  folderSettingsModalAtom,
} from "../../atoms"

export const FolderSettingsModal = () => {
  const { folderId } = useAtomValue(folderSettingsModalAtom)
  const { siteId } = useQueryParse(sitePageSchema)
  const setFolderSettingsModalState = useSetAtom(folderSettingsModalAtom)
  const onClose = () =>
    setFolderSettingsModalState(DEFAULT_FOLDER_SETTINGS_MODAL_STATE)

  return (
    <Modal isOpen={!!folderId} onClose={onClose}>
      <ModalOverlay />
      {!!folderId && (
        <Suspense fallback={<Skeleton />}>
          <SuspendableModalContent
            folderId={folderId}
            siteId={siteId}
            onClose={onClose}
          />
        </Suspense>
      )}
    </Modal>
  )
}

const SuspendableModalContent = ({
  folderId,
  siteId,
  onClose,
}: {
  siteId: number
  onClose: () => void
  folderId: string
}) => {
  const [{ title: originalTitle, permalink: originalPermalink, parentId }] =
    trpc.folder.readFolder.useSuspenseQuery({
      siteId,
      resourceId: Number(folderId),
    })
  const { setValue, register, handleSubmit, watch, formState, getFieldState } =
    useZodForm({
      defaultValues: {
        title: originalTitle,
        permalink: originalPermalink,
      },
      schema: baseEditFolderSchema.omit({ siteId: true, resourceId: true }),
    })
  const { errors, isValid } = formState
  const utils = trpc.useUtils()
  const toast = useToast()
  const { mutate, isLoading } = trpc.folder.editFolder.useMutation({
    onSettled: onClose,
    onSuccess: async () => {
      await utils.site.list.invalidate()
      await utils.resource.listWithoutRoot.invalidate()
      await utils.resource.getChildrenOf.invalidate({
        resourceId: parentId ? String(parentId) : null,
      })
      await utils.folder.readFolder.invalidate()
      toast({ title: "Folder updated!", status: "success" })
    },
    onError: (err) => {
      toast({
        title: "Failed to update folder",
        status: "error",
        // TODO: check if this property is correct
        description: err.message,
      })
    },
  })

  const onSubmit = handleSubmit((data) => {
    mutate({ ...data, resourceId: String(folderId), siteId: String(siteId) })
  })

  const [title, permalink] = watch(["title", "permalink"])

  useEffect(() => {
    const permalinkFieldState = getFieldState("permalink")
    // This allows the syncing to happen only when the page title is not dirty
    // Dirty means user has changed the value AND the value is not the same as the default value of "".
    // Once the value has been cleared, dirty state will reset.
    if (!permalinkFieldState.isDirty) {
      setValue("permalink", generateResourceUrl(title || ""), {
        shouldValidate: !!title,
      })
    }
  }, [getFieldState, setValue, title])

  return (
    <ModalContent key={String(!!folderId)}>
      <form onSubmit={onSubmit}>
        <ModalHeader>Edit "{originalTitle}"</ModalHeader>
        <ModalCloseButton size="sm" />
        <ModalBody>
          <VStack alignItems="flex-start" spacing="1.5rem">
            <FormControl isInvalid={!!errors.title}>
              <FormLabel color="base.content.strong">
                Folder name
                <FormHelperText color="base.content.default">
                  This will be the title of the index page of your folder.
                </FormHelperText>
              </FormLabel>

              <Input
                placeholder="This is a title for your new folder"
                {...register("title")}
              />
              {errors.title?.message ? (
                <FormErrorMessage>{errors.title.message}</FormErrorMessage>
              ) : (
                <FormHelperText mt="0.5rem" color="base.content.medium">
                  {MAX_FOLDER_TITLE_LENGTH - (title || "").length} characters
                  left
                </FormHelperText>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.permalink}>
              <FormLabel color="base.content.strong">
                Folder URL
                <FormHelperText color="base.content.default">
                  This will be applied to every child under this folder.
                </FormHelperText>
              </FormLabel>
              <Input
                placeholder="This is a url for your new page"
                {...register("permalink")}
              />
              {errors.permalink?.message && (
                <FormErrorMessage>{errors.permalink.message}</FormErrorMessage>
              )}

              <Box
                mt="0.5rem"
                py="0.5rem"
                px="0.75rem"
                bg="interaction.support.disabled"
              >
                <Icon mr="0.5rem" as={BiLink} />
                {permalink}
              </Box>

              <FormHelperText mt="0.5rem" color="base.content.medium">
                {MAX_FOLDER_PERMALINK_LENGTH - (permalink || "").length}{" "}
                characters left
              </FormHelperText>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="clear">
            Close
          </Button>
          <Button isLoading={isLoading} isDisabled={!isValid} type="submit">
            Save changes
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}
