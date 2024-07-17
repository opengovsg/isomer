import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { z } from "zod"
import { useEffect } from "react"
import { useRouter } from "next/router"
import {
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
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
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { Controller } from "react-hook-form"

import { useZodForm } from "~/lib/form"
import {
  createPageSchema,
  MAX_PAGE_URL_LENGTH,
  MAX_TITLE_LENGTH,
} from "~/schemas/page"
import { trpc } from "~/utils/trpc"

interface PageCreateModalProps
  extends Pick<UseDisclosureReturn, "isOpen" | "onClose"> {
  siteId: number
  folderId?: number
}

const generatePageUrl = (value: string) => {
  return (
    value
      .toLowerCase()
      // Replace non-alphanum characters with hyphen for UX
      .replace(/[^a-z0-9]/g, "-")
  )
}

const clientCreatePageSchema = createPageSchema.omit({
  siteId: true,
  folderId: true,
})

type ClientCreatePageSchema = z.input<typeof clientCreatePageSchema>

export const PageCreateModal = ({
  isOpen,
  onClose,
  siteId,
  folderId,
}: PageCreateModalProps): JSX.Element => {
  const { mutate, isLoading } = trpc.page.createPage.useMutation({
    onSuccess: onClose,
    // TOOD: Error handling
  })

  const submitCallback = (values: ClientCreatePageSchema) => {
    mutate({
      ...values,
      siteId,
      folderId,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
    >
      <ModalOverlay />
      <PageCreateModalContent
        key={String(isOpen)}
        onSubmit={submitCallback}
        isLoading={isLoading}
        onClose={onClose}
      />
    </Modal>
  )
}

export default PageCreateModal

const PageCreateModalContent = ({
  onSubmit,
  isLoading,
  onClose,
}: {
  onSubmit: (values: ClientCreatePageSchema) => void
  isLoading: boolean
  onClose: () => void
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    getFieldState,
    setValue,
    formState: { errors },
  } = useZodForm({
    schema: createPageSchema.omit({
      siteId: true,
      folderId: true,
    }),
    defaultValues: {
      pageTitle: "",
      pageUrl: "",
    },
  })

  const [title, url] = watch(["pageTitle", "pageUrl"])

  /**
   * As user edits the Page title, Page URL is updated as an hyphenated form of the page title.
   * If user edits Page URL, the “syncing” stops.
   *
   * 1. adds page title A
   * 2. edits page url A
   * 3. deletes page title A
   * 4. resets to page url
   * 5. starts typing new page title B -> page url syncs w new page title B
   */
  useEffect(() => {
    // This allows the syncing to happen only when the page title is not dirty
    // Dirty means user has changed the value AND the value is not the same as the default value of "".
    // Once the value has been cleared, dirty state will reset.
    if (!getFieldState("pageUrl").isDirty) {
      setValue("pageUrl", generatePageUrl(title))
    }
  }, [getFieldState, setValue, title])

  const handleCreatePage = handleSubmit((values) => {
    onSubmit(values)
  })
  return (
    <ModalContent>
      <ModalCloseButton isDisabled={isLoading} />
      <ModalHeader color="base.content.strong">
        Tell us about your new page
      </ModalHeader>
      <form onSubmit={handleCreatePage}>
        <ModalBody>
          <Stack gap={"1.5em"}>
            <Text fontSize="md" color="base.content.default">
              You can change these later.
            </Text>
            {/* Section 1: Page Title */}
            <FormControl isInvalid={!!errors.pageTitle} isReadOnly={isLoading}>
              <FormLabel color="base.content.strong">
                Page title
                <FormHelperText color="base.content.default">
                  Title should be descriptive
                </FormHelperText>
              </FormLabel>

              <Input
                placeholder="This is a title for your new page"
                {...register("pageTitle")}
              />
              {errors.pageTitle?.message ? (
                <FormErrorMessage>{errors.pageTitle.message}</FormErrorMessage>
              ) : (
                <FormHelperText mt={"0.5em"} color="base.content.medium">
                  {MAX_TITLE_LENGTH - title.length} characters left
                </FormHelperText>
              )}
            </FormControl>

            {/* Section 2: Page URL */}
            <FormControl isInvalid={!!errors.pageUrl} isReadOnly={isLoading}>
              <FormLabel>
                Page URL
                <FormHelperText>URL should be short and simple</FormHelperText>
              </FormLabel>
              <InputGroup>
                <InputLeftAddon
                  bg="interaction.support.disabled"
                  color="base.divider.strong"
                >
                  your-site.gov.sg/
                </InputLeftAddon>
                <Controller
                  control={control}
                  name="pageUrl"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      {...field}
                      onChange={(e) => {
                        onChange(generatePageUrl(e.target.value))
                      }}
                    />
                  )}
                />
              </InputGroup>

              {errors.pageUrl?.message ? (
                <FormErrorMessage>{errors.pageUrl.message}</FormErrorMessage>
              ) : (
                <FormHelperText mt={"0.5em"} color="base.content.medium">
                  {MAX_PAGE_URL_LENGTH - url.length} characters left
                </FormHelperText>
              )}
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="link"
            mr={5}
            onClick={onClose}
            isDisabled={isLoading}
            fontWeight={500}
            color={"base.content.strong"}
          >
            Cancel
          </Button>
          <Button
            bgColor="interaction.main.default"
            type="submit"
            isLoading={isLoading}
          >
            Create page
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}
