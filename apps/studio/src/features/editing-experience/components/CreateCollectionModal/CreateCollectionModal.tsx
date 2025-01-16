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
import { Controller } from "react-hook-form"
import { BiLink } from "react-icons/bi"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useZodForm } from "~/lib/form"
import { createCollectionSchema } from "~/schemas/collection"
import {
  MAX_FOLDER_PERMALINK_LENGTH,
  MAX_FOLDER_TITLE_LENGTH,
} from "~/schemas/folder"
import { trpc } from "~/utils/trpc"
import { generateResourceUrl } from "../utils"

type CreateCollectionProps = z.infer<typeof createCollectionSchema>

type CreateCollectionModalProps = Pick<
  UseDisclosureReturn,
  "isOpen" | "onClose"
> &
  Pick<CreateCollectionProps, "siteId">

export const CreateCollectionModal = ({
  isOpen,
  onClose,
  siteId,
}: CreateCollectionModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <CreateCollectionModalContent
        isOpen={isOpen}
        key={String(isOpen)}
        onClose={onClose}
        siteId={siteId}
      />
    </Modal>
  )
}

const CreateCollectionModalContent = ({
  onClose,
  siteId,
}: CreateCollectionModalProps) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState,
    setValue,
    getFieldState,
  } = useZodForm({
    defaultValues: {
      collectionTitle: "",
      permalink: "",
    },
    schema: createCollectionSchema.omit({
      siteId: true,
    }),
  })
  const { errors, isValid } = formState
  const utils = trpc.useUtils()
  const toast = useToast()
  const { mutate, isLoading } = trpc.collection.create.useMutation({
    onSettled: onClose,
    onSuccess: async () => {
      await utils.resource.listWithoutRoot.invalidate()
      await utils.resource.countWithoutRoot.invalidate()
      await utils.resource.getChildrenOf.invalidate()
      toast({
        title: "Collection created!",
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (err) => {
      toast({
        title: "Failed to create collection",
        status: "error",
        // TODO: check if this property is correct
        description: err.message,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const [collectionTitle, permalink] = watch(["collectionTitle", "permalink"])
  const onSubmit = handleSubmit((data) => {
    mutate({ ...data, siteId })
  })

  useEffect(() => {
    const permalinkFieldState = getFieldState("permalink")
    // This allows the syncing to happen only when the page title is not dirty
    // Dirty means user has changed the value AND the value is not the same as the default value of "".
    // Once the value has been cleared, dirty state will reset.
    if (!permalinkFieldState.isDirty) {
      setValue("permalink", generateResourceUrl(collectionTitle), {
        shouldValidate: !!collectionTitle,
      })
    }
  }, [getFieldState, setValue, collectionTitle])

  return (
    <ModalContent>
      <form onSubmit={onSubmit}>
        <ModalHeader mr="3.5rem">Create a new collection</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack alignItems="flex-start" spacing="1.5rem">
            <FormControl isInvalid={!!errors.collectionTitle}>
              <FormLabel color="base.content.strong">
                Collection name
                <FormHelperText color="base.content.default">
                  This will be the title of the index page of your collection.
                </FormHelperText>
              </FormLabel>

              <Input
                placeholder="This is a title for your new collection"
                {...register("collectionTitle")}
              />
              {errors.collectionTitle?.message ? (
                <FormErrorMessage>
                  {errors.collectionTitle.message}
                </FormErrorMessage>
              ) : (
                <FormHelperText mt="0.5rem" color="base.content.medium">
                  {MAX_FOLDER_TITLE_LENGTH - collectionTitle.length} characters
                  left
                </FormHelperText>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.permalink}>
              <FormLabel color="base.content.strong">
                Collection URL
                <FormHelperText color="base.content.default">
                  This will be applied to every child under this collection.
                </FormHelperText>
              </FormLabel>
              <Controller
                control={control}
                name="permalink"
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    placeholder="This is a URL for your new collection"
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
            Create collection
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}
