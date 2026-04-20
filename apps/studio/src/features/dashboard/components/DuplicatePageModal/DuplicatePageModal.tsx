import {
  chakra,
  FormControl,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Infobox,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { useAtom } from "jotai"
import { useEffect } from "react"
import { Controller } from "react-hook-form"
import { BiLink } from "react-icons/bi"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { generateResourceUrl } from "~/features/editing-experience/components/utils"
import { useZodForm } from "~/lib/form"
import {
  duplicatePageFormSchema,
  MAX_PAGE_URL_LENGTH,
  MAX_TITLE_LENGTH,
} from "~/schemas/page"
import { trpc } from "~/utils/trpc"

import { duplicatePageModalAtom } from "../../atoms"

/** Same toast id for progress + teardown (see page settings save toast pattern). */
const DUPLICATE_PAGE_PROGRESS_TOAST_ID = "duplicate-page-progress"

const isTrpcConflict = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "data" in error &&
  (error as { data?: { code?: string } }).data?.code === "CONFLICT"

interface DuplicatePageModalProps {
  siteId: number
}

export const DuplicatePageModal = ({
  siteId,
}: DuplicatePageModalProps): JSX.Element => {
  const [modal, setModal] = useAtom(duplicatePageModalAtom)
  const toast = useToast()
  const utils = trpc.useUtils()

  const { data: sourceFullPermalink } = trpc.page.getFullPermalink.useQuery(
    { siteId, pageId: Number(modal?.pageId ?? 0) },
    { enabled: !!modal },
  )

  const formMethods = useZodForm({
    schema: duplicatePageFormSchema,
    defaultValues: { title: "", permalink: "" },
  })

  const {
    register,
    control,
    watch,
    reset,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = formMethods

  const [title, permalinkField] = watch(["title", "permalink"])

  useEffect(() => {
    if (modal) {
      const defaultTitle = `Copy of ${modal.sourceTitle}`.slice(
        0,
        MAX_TITLE_LENGTH,
      )
      reset({
        title: defaultTitle,
        permalink: generateResourceUrl(defaultTitle).slice(
          0,
          MAX_PAGE_URL_LENGTH,
        ),
      })
    }
  }, [modal, reset])

  const parentFullPermalink = (() => {
    if (!sourceFullPermalink) {
      return ""
    }
    const parts = sourceFullPermalink.split("/").filter(Boolean)
    if (parts.length <= 1) {
      return ""
    }
    return `/${parts.slice(0, -1).join("/")}`
  })()

  const fullPermalinkPreview = parentFullPermalink
    ? `${parentFullPermalink}/${permalinkField || ""}`
    : `/${permalinkField || ""}`

  const { mutate: duplicatePage, isPending: isDuplicating } =
    trpc.page.duplicatePage.useMutation({
      onMutate: () => {
        if (toast.isActive(DUPLICATE_PAGE_PROGRESS_TOAST_ID)) {
          toast.close(DUPLICATE_PAGE_PROGRESS_TOAST_ID)
        }
        toast({
          id: DUPLICATE_PAGE_PROGRESS_TOAST_ID,
          status: "loading",
          title: "Duplicating page",
          description:
            "Duplicating this page and its files. This may take a while when there are many assets.",
          duration: null,
          isClosable: true,
        })
      },
    })

  const onClose = () => {
    if (isDuplicating) {
      return
    }
    setModal(null)
    reset()
  }

  const onSubmit = handleSubmit((values) => {
    if (!modal) {
      return
    }

    clearErrors()

    const tableScopeResourceId = modal.tableScopeResourceId
    const pageId = Number(modal.pageId)

    duplicatePage(
      {
        siteId,
        pageId,
        title: values.title,
        permalink: values.permalink,
      },
      {
        onSuccess: () => {
          void (async () => {
            toast.close(DUPLICATE_PAGE_PROGRESS_TOAST_ID)
            await Promise.all([
              utils.resource.listWithoutRoot.invalidate({
                siteId,
                resourceId: tableScopeResourceId,
              }),
              utils.resource.countWithoutRoot.invalidate({
                siteId,
                resourceId: tableScopeResourceId,
              }),
            ])
            toast({
              status: "success",
              title: "Page duplicated",
              description:
                "The new draft is in your site. Open it from the resource list when you want to edit.",
              ...BRIEF_TOAST_SETTINGS,
            })
            setModal(null)
            reset()
          })()
        },
        onError: (error) => {
          toast.close(DUPLICATE_PAGE_PROGRESS_TOAST_ID)
          if (isTrpcConflict(error)) {
            setError(
              "permalink",
              { message: error.message },
              { shouldFocus: true },
            )
            return
          }
          toast({
            status: "error",
            title: "Could not duplicate page",
            description: error.message,
            ...BRIEF_TOAST_SETTINGS,
          })
        },
      },
    )
  })

  return (
    <Modal
      isOpen={!!modal}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick={!isDuplicating}
      closeOnEsc={!isDuplicating}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader pr="3.5rem">Duplicate Page</ModalHeader>
        <ModalCloseButton size="lg" isDisabled={isDuplicating} />
        {modal && (
          <>
            <ModalBody>
              <Stack gap="1.25rem">
                <FormControl isRequired isInvalid={!!errors.title}>
                  <FormLabel color="base.content.strong" mb={0}>
                    Page title
                  </FormLabel>
                  <Input
                    maxLength={MAX_TITLE_LENGTH}
                    my="0.5rem"
                    isDisabled={isDuplicating}
                    {...register("title")}
                  />
                  {errors.title?.message ? (
                    <FormErrorMessage>{errors.title.message}</FormErrorMessage>
                  ) : (
                    <FormHelperText mt="0.5rem" color="base.content.medium">
                      {MAX_TITLE_LENGTH - title.length} characters left
                    </FormHelperText>
                  )}
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.permalink}>
                  <FormLabel>Page URL</FormLabel>
                  <Controller
                    control={control}
                    name="permalink"
                    render={({ field: { onChange, ...field } }) => (
                      <Input
                        maxLength={MAX_PAGE_URL_LENGTH}
                        borderLeftRadius={0}
                        {...field}
                        isDisabled={isDuplicating}
                        onChange={(e) => {
                          onChange(
                            generateResourceUrl(e.target.value).slice(
                              0,
                              MAX_PAGE_URL_LENGTH,
                            ),
                          )
                        }}
                      />
                    )}
                  />
                  <Infobox
                    my="0.5rem"
                    icon={<BiLink />}
                    variant="info-secondary"
                    size="sm"
                  >
                    <Text textStyle="subhead-2" overflow="hidden">
                      <chakra.span color="base.content.medium">
                        {fullPermalinkPreview}
                      </chakra.span>
                    </Text>
                  </Infobox>
                  {errors.permalink?.message ? (
                    <FormErrorMessage>
                      {errors.permalink.message}
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt="0.5rem" color="base.content.medium">
                      {MAX_PAGE_URL_LENGTH - permalinkField.length} characters
                      left
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button
                variant="clear"
                onClick={onClose}
                isDisabled={isDuplicating}
              >
                Cancel
              </Button>
              <Button onClick={onSubmit} isLoading={isDuplicating}>
                Duplicate
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
