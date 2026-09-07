/* oxlint-disable eslint/no-use-before-define, eslint/sort-keys, typescript/strict-void-return, unicorn/no-unnecessary-type-conversion -- core cleanup deferred */
import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { z } from "zod"
import {
  Box,
  FormControl,
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
  FormHelperText,
  FormLabel,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import posthogJs from "posthog-js"
import { useEffect } from "react"
import { Controller } from "react-hook-form"
import { BiLink } from "react-icons/bi"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import {
  createFolderSchema,
  MAX_FOLDER_PERMALINK_LENGTH,
  MAX_FOLDER_TITLE_LENGTH,
} from "~/schemas/folder"
import { trpc } from "~/utils/trpc"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

import { generateResourceUrl } from "../utils"

type CreateFolderProps = z.infer<typeof createFolderSchema>

type CreateFolderModalProps = Pick<UseDisclosureReturn, "isOpen" | "onClose"> &
  Pick<CreateFolderProps, "siteId" | "parentFolderId">

export const CreateFolderModal = ({
  isOpen,
  onClose,
  siteId,
  parentFolderId,
}: CreateFolderModalProps): React.ReactNode => (
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

const CreateFolderModalContent = ({
  onClose,
  siteId,
  parentFolderId,
}: CreateFolderModalProps) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState,
    setValue,
    setError,
    getFieldState,
  } = useZodForm({
    defaultValues: {
      folderTitle: "",
      permalink: "",
    },
    schema: createFolderSchema.omit({ parentFolderId: true, siteId: true }),
  })
  const { errors, isValid } = formState
  const utils = trpc.useUtils()
  const toast = useToast()
  const { mutate, isPending } = trpc.folder.create.useMutation({
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        setError("permalink", { message: err.message }, { shouldFocus: true })
        return
      }
      toast({
        title: "Failed to create folder",
        status: "error",
        // Deferred: check if this property is correct
        description: err.message,
        ...BRIEF_TOAST_SETTINGS,
      })
      onClose()
    },
    onSuccess: async () => {
      posthogJs.capture("folder_created", {
        has_parent_folder: !!isDefinedNumber(parentFolderId),
        site_id: siteId,
      })
      await utils.site.list.invalidate()
      await utils.resource.listWithoutRoot.invalidate()
      await utils.resource.countWithoutRoot.invalidate()
      await utils.resource.getChildrenOf.invalidate()
      toast({
        status: "success",
        title: "Folder created!",
        ...BRIEF_TOAST_SETTINGS,
      })
      onClose()
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
      // NOTE: We don't slice here because the permalink field already has a max length set.
      // Because the `permalink`'s max length is longer than what it's derived from
      // the output of this will always be less than the allowed length for the permalink.
      setValue("permalink", generateResourceUrl(folderTitle), {
        shouldValidate: !!folderTitle,
      })
    }
  }, [getFieldState, setValue, folderTitle])
  // oxlint-disable-next-line typescript/strict-void-return -- core cleanup deferred

  return (
    <ModalContent>
      <form onSubmit={onSubmit}>
        <ModalHeader mr="3.5rem">Create a new folder</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack alignItems="flex-start" spacing="1.5rem">
            <FormControl isRequired isInvalid={!!errors.folderTitle}>
              <FormLabel color="base.content.strong">
                Folder name
                <FormHelperText color="base.content.default">
                  This will be the title of the index page of your folder.
                </FormHelperText>
              </FormLabel>

              <Input
                placeholder="This is a title for your new folder"
                maxLength={MAX_FOLDER_TITLE_LENGTH}
                my="0.5rem"
                {...register("folderTitle")}
              />
              {hasNonEmptyString(errors.folderTitle?.message) ? (
                <FormErrorMessage>
                  {errors.folderTitle.message}
                </FormErrorMessage>
              ) : (
                <FormHelperText color="base.content.medium">
                  {MAX_FOLDER_TITLE_LENGTH - folderTitle.length} characters left
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
                    placeholder="This is a URL for your new folder"
                    noOfLines={1}
                    maxLength={MAX_FOLDER_PERMALINK_LENGTH}
                    {...field}
                    onChange={(e) => {
                      onChange(
                        generateResourceUrl(e.target.value).slice(
                          0,
                          MAX_FOLDER_PERMALINK_LENGTH,
                        ),
                      )
                    }}
                  />
                )}
              />
              {hasNonEmptyString(errors.permalink?.message) && (
                <FormErrorMessage>{errors.permalink.message}</FormErrorMessage>
              )}

              <Box
                mt="0.5rem"
                py="0.5rem"
                px="0.75rem"
                bg="interaction.support.disabled"
                my="0.5rem"
              >
                <Icon mr="0.5rem" as={BiLink} />
                {permalink}
              </Box>

              <FormHelperText color="base.content.medium">
                {MAX_FOLDER_PERMALINK_LENGTH - permalink.length} characters left
              </FormHelperText>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} onClick={onClose} variant="clear">
            Close
          </Button>
          <Button isLoading={isPending} isDisabled={!isValid} type="submit">
            Create Folder
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}
