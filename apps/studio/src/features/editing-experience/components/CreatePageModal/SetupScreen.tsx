import { useEffect } from "react"
import {
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Button, FormErrorMessage } from "@opengovsg/design-system-react"
import { Controller } from "react-hook-form"
import { BiLeftArrowAlt } from "react-icons/bi"

import { APP_GRID_COLUMN } from "~/constants/layouts"
import { MAX_PAGE_URL_LENGTH, MAX_TITLE_LENGTH } from "~/schemas/page"
import { AppGrid } from "~/templates/AppGrid"
import { textStyles } from "~/theme/foundations/textStyles"
import {
  CreatePageFlowStates,
  useCreatePageWizard,
} from "./CreatePageWizardContext"

const generatePageUrl = (value: string) => {
  return (
    value
      .toLowerCase()
      // Replace non-alphanum characters with hyphen for UX
      .replace(/[^a-z0-9]/g, "-")
  )
}

export const CreatePageSetupScreen = () => {
  const { setCurrentStep, formMethods } = useCreatePageWizard()

  const {
    register,
    handleSubmit,
    control,
    watch,
    getFieldState,
    setValue,
    formState: { errors },
  } = formMethods

  const [title, url] = watch(["title", "permalink"])

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
    if (!getFieldState("permalink").isDirty) {
      setValue("permalink", generatePageUrl(title))
    }
  }, [getFieldState, setValue, title])

  // Only care if validation passes, if it does then move to next step
  const handleCreatePage = handleSubmit(() => {
    setCurrentStep([CreatePageFlowStates.Layout, 1])
  })

  return (
    <>
      <ModalHeader color="base.content.strong">
        <AppGrid>
          <Stack gridColumn={APP_GRID_COLUMN}>
            <Text as="h1">Page details</Text>
            <Text textStyle="body-2" color="base.content.default">
              You can change these later.
            </Text>
          </Stack>
        </AppGrid>
      </ModalHeader>
      <form onSubmit={handleCreatePage}>
        <ModalBody p={0}>
          <AppGrid>
            <Stack gap="4rem" gridColumn={APP_GRID_COLUMN}>
              <Stack gap="1.5rem">
                {/* Section 1: Page Title */}
                <FormControl isInvalid={!!errors.title}>
                  <FormLabel color="base.content.strong">
                    Page title
                    <FormHelperText color="base.content.default">
                      Title should be descriptive
                    </FormHelperText>
                  </FormLabel>

                  <Input
                    placeholder="This is a title for your new page"
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

                {/* Section 2: Page URL */}
                <FormControl isInvalid={!!errors.permalink}>
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
                      name="permalink"
                      render={({ field: { onChange, ...field } }) => (
                        <Input
                          borderLeftRadius={0}
                          placeholder="URL will be autopopulated if left untouched"
                          {...field}
                          onChange={(e) => {
                            onChange(generatePageUrl(e.target.value))
                          }}
                        />
                      )}
                    />
                  </InputGroup>

                  {errors.permalink?.message ? (
                    <FormErrorMessage>
                      {errors.permalink.message}
                    </FormErrorMessage>
                  ) : (
                    <FormHelperText mt="0.5rem" color="base.content.medium">
                      {MAX_PAGE_URL_LENGTH - url.length} characters left
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
              <Stack flexDirection="row" align="center" justify="space-between">
                <Button
                  variant="link"
                  {...textStyles["subhead-2"]}
                  leftIcon={<BiLeftArrowAlt fontSize="1.25rem" />}
                >
                  Back to all pages
                </Button>
                <Button type="submit">Next: Pick a layout</Button>
              </Stack>
            </Stack>
          </AppGrid>
        </ModalBody>
      </form>
    </>
  )
}
