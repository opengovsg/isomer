import React, { useEffect, useState } from "react"
import {
  Box,
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
import { SubmitHandler, useForm } from "react-hook-form"

interface PageCreateModalProps {
  isOpen: boolean
  onClose: () => void
}

type PageCreateFormFields = {
  title: string
  url: string
}

/* TODO: Can extract these out to a constants file if can be reused */
const ERROR_MESSAGES = {
  MIN_LENGTH: "Minimum length should be 1",
  MAX_LENGTH: (max: number) => `Maximum length should be ${max}`,
  TITLE: {
    REQUIRED: "Enter a title for this page",
  },
  URL: {
    REQUIRED: "Enter a URL for this page.",
  },
}

export const PageCreateModal = ({
  isOpen,
  onClose,
}: PageCreateModalProps): JSX.Element => {
  const MAX_TITLE_LENGTH = 100
  const MAX_PAGE_URL_LENGTH = 150
  const [titleLen, setTitleLen] = useState(0)
  const [pageUrlLen, setPageUrlLen] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PageCreateFormFields>()

  const watchAllFields = watch()

  useEffect(() => {
    setTitleLen(watchAllFields.title?.length || 0)
    setPageUrlLen(watchAllFields.url?.length || 0)
  }, [watchAllFields])

  /* TODO: When integrating with BE */
  const onSubmit: SubmitHandler<PageCreateFormFields> = (data) =>
    console.log(data)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalCloseButton />
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="base.content.strong">
          Tell us about your new page
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Stack gap={"1.5em"}>
              <Text fontSize="md" color="base.content.default">
                You can change these later.
              </Text>
              {/* Section 1: Page Title */}
              <FormControl isInvalid={!!errors.title}>
                <FormLabel color="base.content.strong">
                  Page title
                  <FormHelperText color="base.content.default">
                    Title should be descriptive
                  </FormHelperText>
                </FormLabel>

                <Input
                  type="text"
                  placeholder="This is a title for your new page"
                  id="title"
                  {...register("title", {
                    required: ERROR_MESSAGES.TITLE.REQUIRED,
                    validate: (value) =>
                      value.trim().length !== 0 ||
                      ERROR_MESSAGES.TITLE.REQUIRED,
                    minLength: {
                      value: 1,
                      message: ERROR_MESSAGES.MIN_LENGTH,
                    },
                    maxLength: {
                      value: MAX_TITLE_LENGTH,
                      message: ERROR_MESSAGES.MAX_LENGTH(MAX_TITLE_LENGTH),
                    },
                  })}
                  isInvalid={!!errors.title}
                />
                {errors.title && errors.title.message ? (
                  <FormErrorMessage>{errors.title.message}</FormErrorMessage>
                ) : (
                  <FormHelperText mt={"0.5em"} color="base.content.medium">
                    {MAX_TITLE_LENGTH - titleLen} characters left
                  </FormHelperText>
                )}
              </FormControl>

              {/* Section 2: Page URL */}
              <FormControl isInvalid={!!errors.url}>
                <FormLabel>
                  Page URL
                  <FormHelperText>
                    URL should be short and simple
                  </FormHelperText>
                </FormLabel>
                <InputGroup>
                  <InputLeftAddon
                    bgColor="interaction.support.disabled"
                    color="base.divider.strong"
                  >
                    your-site.gov.sg/
                  </InputLeftAddon>
                  <Input
                    type="tel"
                    defaultValue={"hello-world"}
                    color="base.content.default"
                    {...register("url", {
                      required: ERROR_MESSAGES.URL.REQUIRED,
                      minLength: {
                        value: 1,
                        message: ERROR_MESSAGES.MIN_LENGTH,
                      },
                      maxLength: {
                        value: MAX_PAGE_URL_LENGTH,
                        message: ERROR_MESSAGES.MAX_LENGTH(MAX_PAGE_URL_LENGTH),
                      },
                    })}
                    isInvalid={!!errors.url}
                  />
                </InputGroup>

                {errors.url && errors.url.message ? (
                  <FormErrorMessage>{errors.url.message}</FormErrorMessage>
                ) : (
                  <FormHelperText mt={"0.5em"} color="base.content.medium">
                    {MAX_PAGE_URL_LENGTH - pageUrlLen} characters left
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
