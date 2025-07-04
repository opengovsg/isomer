import { Suspense } from "react"
import {
  Box,
  chakra,
  FormControl,
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
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  useToast,
} from "@opengovsg/design-system-react"
import { useAtomValue, useSetAtom } from "jotai"
import { Controller } from "react-hook-form"
import { BiLink } from "react-icons/bi"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
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

interface SuspendablePermalinkProps {
  siteId: number
  folderId: string
  permalink: string
}
const SuspendablePermalink = ({
  siteId,
  folderId,
  permalink,
}: SuspendablePermalinkProps) => {
  const [{ fullPermalink }] =
    trpc.resource.getWithFullPermalink.useSuspenseQuery({
      siteId,
      resourceId: folderId ? String(folderId) : "",
    })

  return (
    <Text textStyle="subhead-2" overflow="hidden">
      <chakra.span color="base.content.medium">
        {fullPermalink.split("/").slice(0, -1).join("/")}
      </chakra.span>
      /{permalink}
    </Text>
  )
}

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
    trpc.folder.getMetadata.useSuspenseQuery({
      siteId,
      resourceId: Number(folderId),
    })
  const { register, handleSubmit, watch, control, formState } = useZodForm({
    mode: "onChange",
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
      await utils.resource.listWithoutRoot.invalidate()
      await utils.resource.getChildrenOf.invalidate({
        resourceId: parentId ? String(parentId) : null,
      })
      await utils.folder.getMetadata.invalidate({
        resourceId: Number(folderId),
      })
      await utils.folder.getIndexpage.invalidate({
        resourceId: folderId,
      })
      await utils.collection.getMetadata.invalidate({
        resourceId: Number(folderId),
      })
      toast({
        title: "Folder updated!",
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to update folder",
        status: "error",
        // TODO: check if this property is correct
        description: err.message,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const onSubmit = handleSubmit((data) => {
    mutate({ ...data, resourceId: String(folderId), siteId: String(siteId) })
  })

  const [title, permalink] = watch(["title", "permalink"])

  return (
    <ModalContent key={String(!!folderId)}>
      <form onSubmit={onSubmit}>
        <ModalHeader mr="3.5rem">Edit "{originalTitle}"</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack alignItems="flex-start" spacing="1.5rem">
            <FormControl isRequired isInvalid={!!errors.title}>
              <FormLabel color="base.content.strong">
                Folder name
                <FormHelperText color="base.content.default">
                  This will be the title of the index page of your folder.
                </FormHelperText>
              </FormLabel>

              <Input
                placeholder="This is a title for your new folder"
                maxLength={MAX_FOLDER_TITLE_LENGTH}
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
            <FormControl isRequired isInvalid={!!errors.permalink}>
              <FormLabel color="base.content.strong">
                Folder URL
                <FormHelperText color="base.content.default">
                  This will be applied to every child under this folder.
                </FormHelperText>
              </FormLabel>
              <Controller
                control={control}
                name="permalink"
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    placeholder="This is a URL for your folder"
                    {...field}
                    maxLength={MAX_FOLDER_PERMALINK_LENGTH}
                    onChange={(e) => {
                      onChange(generateResourceUrl(e.target.value))
                    }}
                  />
                )}
              />
              {errors.permalink?.message ? (
                <FormErrorMessage>{errors.permalink.message}</FormErrorMessage>
              ) : (
                <Suspense fallback={<Skeleton w="100%" h="2rem" mt="0.5rem" />}>
                  <Box
                    mt="0.5rem"
                    py="0.5rem"
                    px="0.75rem"
                    bg="interaction.support.disabled"
                    display="flex"
                    alignItems="center"
                  >
                    <Icon mr="0.5rem" as={BiLink} />
                    <SuspendablePermalink
                      siteId={siteId}
                      folderId={folderId}
                      permalink={permalink}
                    />
                  </Box>
                </Suspense>
              )}

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
