import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { z } from "zod"
import { useEffect } from "react"
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { BiLink } from "react-icons/bi"

import { useZodForm } from "~/lib/form"
import {
  createFolderSchema,
  MAX_FOLDER_PERMALINK_LENGTH,
  MAX_FOLDER_TITLE_LENGTH,
} from "~/schemas/folder"
import { trpc } from "~/utils/trpc"
import { generateResourceUrl } from "../utils"

type CreateFolderProps = z.infer<typeof createFolderSchema>

type CreateFolderModalProps = Pick<UseDisclosureReturn, "isOpen" | "onClose"> &
  Pick<CreateFolderProps, "siteId" | "parentFolderId">

export const CreateFolderModal = ({
  isOpen,
  onClose,
  siteId,
  parentFolderId,
}: CreateFolderModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <CreateFolderModalContent
        key={String(isOpen)}
        isOpen={isOpen}
        onClose={onClose}
        siteId={siteId}
        parentFolderId={parentFolderId}
      />
    </Modal>
  )
}

const CreateFolderModalContent = ({
  onClose,
  siteId,
  parentFolderId,
}: CreateFolderModalProps) => {
  const { register, handleSubmit, watch, formState, setValue, getFieldState } =
    useZodForm({
      defaultValues: {
        folderTitle: "",
        permalink: "",
      },
      schema: createFolderSchema.omit({ siteId: true, parentFolderId: true }),
    })
  const { errors, isValid } = formState
  const utils = trpc.useUtils()
  const toast = useToast()
  const { mutate, isLoading } = trpc.folder.create.useMutation({
    onSettled: onClose,
    onSuccess: async () => {
      await utils.site.list.invalidate()
      await utils.resource.listWithoutRoot.invalidate()
      await utils.resource.countWithoutRoot.invalidate()
      await utils.resource.getChildrenOf.invalidate()
      toast({ title: "Folder created!", status: "success" })
    },
    onError: (err) => {
      toast({
        title: "Failed to create folder",
        status: "error",
        // TODO: check if this property is correct
        description: err.message,
      })
    },
  })

  const [folderTitle, permalink] = watch(["folderTitle", "permalink"])
  const onSubmit = handleSubmit((data) => {
    mutate({ ...data, parentFolderId, siteId })
  })

  useEffect(() => {
    const permalinkFieldState = getFieldState("permalink")
    // This allows the syncing to happen only when the page title is not dirty
    // Dirty means user has changed the value AND the value is not the same as the default value of "".
    // Once the value has been cleared, dirty state will reset.
    if (!permalinkFieldState.isDirty) {
      setValue("permalink", generateResourceUrl(folderTitle), {
        shouldValidate: !!folderTitle,
      })
    }
  }, [getFieldState, setValue, folderTitle])

  return (
    <ModalContent>
      <form onSubmit={onSubmit}>
        <ModalHeader>Create a new folder </ModalHeader>
        <ModalCloseButton size="sm" />
        <ModalBody>
          <VStack alignItems="flex-start" spacing="1.5rem">
            <FormControl isInvalid={!!errors.folderTitle}>
              <FormLabel color="base.content.strong">
                Folder name
                <FormHelperText color="base.content.default">
                  This will be the title of the index page of your folder.
                </FormHelperText>
              </FormLabel>

              <Input
                placeholder="This is a title for your new folder"
                {...register("folderTitle")}
              />
              {errors.folderTitle?.message ? (
                <FormErrorMessage>
                  {errors.folderTitle.message}
                </FormErrorMessage>
              ) : (
                <FormHelperText mt="0.5rem" color="base.content.medium">
                  {MAX_FOLDER_TITLE_LENGTH - folderTitle.length} characters left
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
                {MAX_FOLDER_PERMALINK_LENGTH - permalink.length} characters left
              </FormHelperText>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="clear">
            Close
          </Button>
          <Button isLoading={isLoading} isDisabled={!isValid} type="submit">
            Create Folder
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}
