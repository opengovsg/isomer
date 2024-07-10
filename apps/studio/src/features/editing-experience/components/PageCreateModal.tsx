import type { UseDisclosureReturn } from "@chakra-ui/react"
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
import { createPageSchema } from "~/schemas/page"

type PageCreateModalProps = Pick<UseDisclosureReturn, "isOpen" | "onClose">

export const PageCreateModal = ({
  isOpen,
  onClose,
}: PageCreateModalProps): JSX.Element => {
  const MAX_TITLE_LENGTH = 100
  const MAX_PAGE_URL_LENGTH = 150

  const {
    register,
    handleSubmit,
    control,
    watch,
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalCloseButton />
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="base.content.strong">
          Tell us about your new page
        </ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={handleSubmit((values) => {
            console.log(values)
          })}
        >
          <ModalBody>
            <Stack gap={"1.5em"}>
              <Text fontSize="md" color="base.content.default">
                You can change these later.
              </Text>
              {/* Section 1: Page Title */}
              <FormControl isInvalid={!!errors.pageTitle}>
                <FormLabel color="base.content.strong">
                  Page title
                  <FormHelperText color="base.content.default">
                    Title should be descriptive
                  </FormHelperText>
                </FormLabel>

                <Input
                  placeholder="This is a title for your new page"
                  id="title"
                  {...register("pageTitle")}
                />
                {errors.pageTitle?.message ? (
                  <FormErrorMessage>
                    {errors.pageTitle.message}
                  </FormErrorMessage>
                ) : (
                  <FormHelperText mt={"0.5em"} color="base.content.medium">
                    {MAX_TITLE_LENGTH - title.length} characters left
                  </FormHelperText>
                )}
              </FormControl>

              {/* Section 2: Page URL */}
              <FormControl isInvalid={!!errors.pageUrl}>
                <FormLabel>
                  Page URL
                  <FormHelperText>
                    URL should be short and simple
                  </FormHelperText>
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
                          // Only allow lowercase alphanumeric characters and hyphens
                          onChange(
                            e.target.value
                              .toLowerCase()
                              // TODO(ISOM-1187): Add storybook snapshot test
                              // Replace non-alphanum characters with hyphen for UX
                              .replace(/[^a-z0-9]/g, "-"),
                          )
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
              fontWeight={500}
              color={"base.content.strong"}
            >
              Cancel
            </Button>
            <Button bgColor="interaction.main.default" type="submit">
              Create page
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default PageCreateModal
