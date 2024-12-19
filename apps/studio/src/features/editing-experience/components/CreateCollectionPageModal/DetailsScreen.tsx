import { useEffect } from "react"
import {
  chakra,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  ListItem,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
  UnorderedList,
  Wrap,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  Infobox,
} from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { Controller } from "react-hook-form"
import { BiLink } from "react-icons/bi"

import { MAX_PAGE_URL_LENGTH, MAX_TITLE_LENGTH } from "~/schemas/page"
import { AppGrid } from "~/templates/AppGrid"
import { useCreateCollectionPageWizard } from "./CreateCollectionPageWizardContext"
import { PreviewLayout } from "./PreviewLayout"

const generatePageUrl = (value: string) => {
  return (
    value
      .toLowerCase()
      // Replace non-alphanum characters with hyphen for UX
      .replace(/[^a-z0-9]/g, "-")
  )
}

export const CreateCollectionPageDetailsScreen = () => {
  const {
    formMethods,
    onClose,
    handleBackToTypeScreen,
    handleCreatePage,
    isLoading,
    fullPermalink,
  } = useCreateCollectionPageWizard()

  const {
    register,
    control,
    watch,
    getFieldState,
    setValue,
    formState: { errors },
  } = formMethods

  const [title, url, type] = watch(["title", "permalink", "type"])

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
    const permalinkFieldState = getFieldState("permalink")
    // This allows the syncing to happen only when the page title is not dirty
    // Dirty means user has changed the value AND the value is not the same as the default value of "".
    // Once the value has been cleared, dirty state will reset.
    if (!permalinkFieldState.isDirty) {
      setValue("permalink", generatePageUrl(title), {
        shouldValidate: !!title,
      })
    }
  }, [getFieldState, setValue, title])

  return (
    <>
      <ModalHeader
        color="base.content.strong"
        borderBottom="1px solid"
        borderColor="base.divider.medium"
        py="0.75rem"
      >
        <Stack
          justify="space-between"
          align="center"
          flexDir={{ base: "column", md: "row" }}
        >
          <Text>Create a new collection item</Text>
          <Wrap
            shouldWrapChildren
            flexDirection="row"
            justify={{ base: "flex-end", md: "flex-start" }}
            align="center"
            gap="0.75rem"
          >
            <Button variant="clear" onClick={onClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToTypeScreen}
              isDisabled={isLoading}
            >
              Change page type
            </Button>
            <Button onClick={handleCreatePage} isLoading={isLoading}>
              Start editing
            </Button>
          </Wrap>
        </Stack>
      </ModalHeader>
      <ModalBody p={0} overflow="hidden" bg="white">
        <AppGrid height="100%" px={0}>
          <Stack
            gridColumn="1 / 5"
            height="100%"
            gap="2rem"
            mt="10vh"
            px="3rem"
            {...(type === ResourceType.CollectionLink && { mt: "50%" })}
          >
            <Stack>
              <Text as="h2" textStyle="h4">
                {type === ResourceType.CollectionPage
                  ? "What is your page about?"
                  : "Give your item a title."}
              </Text>
              {type === ResourceType.CollectionPage ? (
                <Text textStyle="body-2">You can change these later.</Text>
              ) : (
                <Text textStyle="body-2">
                  You can change this later. An item can be a:
                  <UnorderedList>
                    <ListItem>A page from your website</ListItem>
                    <ListItem>
                      An external link (e.g, you might want to link an e-service
                      on another domain)
                    </ListItem>
                    <ListItem>File (PDF)</ListItem>
                  </UnorderedList>
                </Text>
              )}
            </Stack>
            <Stack gap="1.5rem">
              {/* Section 1: Page Title */}
              <FormControl isInvalid={!!errors.title}>
                <FormLabel color="base.content.strong">
                  {type === ResourceType.CollectionPage ? "Page" : "Item"} title
                  <FormHelperText color="base.content.default">
                    Title should be descriptive
                  </FormHelperText>
                </FormLabel>

                <Input
                  placeholder="This is a title for your new page"
                  maxLength={MAX_TITLE_LENGTH}
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
              <FormControl
                isInvalid={!!errors.permalink}
                display={type === ResourceType.CollectionLink ? "none" : "auto"}
              >
                <FormLabel>
                  Page URL
                  <FormHelperText>
                    URL should be short and simple
                  </FormHelperText>
                </FormLabel>
                <Controller
                  control={control}
                  name="permalink"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      isDisabled={type === ResourceType.CollectionLink}
                      borderLeftRadius={0}
                      placeholder="URL will be autopopulated if left untouched"
                      {...field}
                      onChange={(e) => {
                        onChange(
                          generatePageUrl(e.target.value).slice(
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
                      {fullPermalink}
                    </chakra.span>
                    /{url}
                  </Text>
                </Infobox>

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
            {/* TODO: Add category */}
          </Stack>
          <Flex gridColumn="5 / 13">
            <PreviewLayout />
          </Flex>
        </AppGrid>
      </ModalBody>
    </>
  )
}
