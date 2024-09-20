import type { Static } from "@sinclair/typebox"
import { useMemo } from "react"
import {
  Box,
  chakra,
  FormControl,
  Grid,
  GridItem,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Infobox,
  Input,
  useToast,
} from "@opengovsg/design-system-react"
import { getLayoutMetadataSchema } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import Ajv from "ajv"
import { Controller } from "react-hook-form"
import { BiLink } from "react-icons/bi"
import { z } from "zod"

import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { generateResourceUrl } from "~/features/editing-experience/components/utils"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import {
  MAX_PAGE_URL_LENGTH,
  MAX_TITLE_LENGTH,
  pageSettingsSchema,
} from "~/schemas/page"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { trpc } from "~/utils/trpc"

const THREE_SECONDS_IN_MS = 3000
const SUCCESS_TOAST_ID = "save-page-settings-success"
const ajv = new Ajv({ strict: false, logger: false })

const PageSettings = () => {
  const { pageId, siteId } = useQueryParse(editPageSchema)
  const [{ type, title: originalTitle, content }] =
    trpc.page.readPageAndBlob.useSuspenseQuery(
      {
        pageId,
        siteId,
      },
      { refetchOnWindowFocus: false },
    )

  const [permalinkTree] = trpc.page.getPermalinkTree.useSuspenseQuery(
    {
      pageId,
      siteId,
    },
    { refetchOnWindowFocus: false },
  )
  const pageMetaSchema = getLayoutMetadataSchema(content.layout)
  const validateFn = ajv.compile<Static<typeof pageMetaSchema>>(pageMetaSchema)

  const {
    register,
    watch,
    control,
    reset,
    handleSubmit,
    formState: { isDirty, errors },
  } = useZodForm({
    schema: pageSettingsSchema.omit({ pageId: true, siteId: true }).extend({
      meta: z.unknown(),
    }),
    defaultValues: {
      title: originalTitle,
      permalink: permalinkTree[permalinkTree.length - 1] || "/",
      meta: content.meta,
    },
  })

  const [title, permalink] = watch(["title", "permalink"])

  const permalinksToRender = useMemo(() => {
    // Case 1: Root page
    if (permalinkTree.length === 0 || permalinkTree[0] === "") {
      return {
        permalink: "/",
        parentPermalinks: "",
      }
    }

    const parentPermalinks = permalinkTree.slice(0, -1).join("/").trim()
    // Case 2: Parent is root page
    if (!parentPermalinks) {
      return {
        permalink,
        parentPermalinks: "/",
      }
    }

    // Default case: Nested page
    return {
      permalink,
      parentPermalinks: `/${parentPermalinks}/`,
    }
  }, [permalink, permalinkTree])

  const toast = useToast({ duration: THREE_SECONDS_IN_MS, isClosable: true })
  const utils = trpc.useUtils()

  const { mutate: updatePageSettings } = trpc.page.updateSettings.useMutation({
    onSuccess: async () => {
      // TODO: we should use a specialised query for this rather than the general one that retrives the page and the blob
      await utils.page.invalidate()
      await utils.resource.invalidate()
      await utils.folder.invalidate()
      if (toast.isActive(SUCCESS_TOAST_ID)) {
        toast.close(SUCCESS_TOAST_ID)
      }
      toast({
        id: SUCCESS_TOAST_ID,
        title: "Saved page settings",
        description: "Publish this page for your changes to go live.",
        status: "success",
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to save page settings",
        description: error.message,
        status: "error",
      })
      reset()
    },
  })

  const onSubmit = handleSubmit(({ meta, ...rest }) => {
    if (isDirty) {
      updatePageSettings(
        {
          pageId,
          siteId,
          meta: JSON.stringify(meta),
          ...rest,
        },
        {
          onSuccess: () => reset({ meta, ...rest }),
        },
      )
    }
  })

  return (
    <form onBlur={onSubmit}>
      <Grid w="100vw" my="3rem" templateColumns="repeat(4, 1fr)">
        <GridItem colSpan={1}></GridItem>
        <GridItem colSpan={2}>
          <VStack w="100%" gap="2rem" alignItems="flex-start">
            <Box>
              <Text as="h3" textStyle="h3-semibold">
                Page settings
              </Text>
              <Text textStyle="body-2" mt="0.5rem">
                These settings will only affect this page. Publish the page to
                make these changes live.
              </Text>
            </Box>
            <FormControl isRequired isInvalid={!!errors.permalink}>
              <FormLabel>Page URL</FormLabel>
              <Controller
                control={control}
                name="permalink"
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    isDisabled={type === ResourceType.RootPage}
                    placeholder="URL will be autopopulated if left untouched"
                    noOfLines={1}
                    mt="0.5rem"
                    w="100%"
                    {...field}
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
                <Text noOfLines={1} textStyle="subhead-2">
                  <chakra.span color="base.content.medium">
                    {permalinksToRender.parentPermalinks}
                  </chakra.span>
                  {permalinksToRender.permalink}
                </Text>
              </Infobox>
              <FormHelperText>
                {MAX_PAGE_URL_LENGTH - permalink.length} characters left
              </FormHelperText>
              <FormErrorMessage>{errors.permalink?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.title}>
              <FormLabel
                description="By default, this is the title of your your page. Edit this if
                you want to show a different title on search engines."
              >
                Page title
              </FormLabel>
              <Input
                w="100%"
                noOfLines={1}
                maxLength={MAX_TITLE_LENGTH}
                isDisabled={type === ResourceType.RootPage}
                {...register("title")}
                mt="0.5rem"
              />
              <FormHelperText pt="0.5rem">
                {MAX_TITLE_LENGTH - title.length} characters left
              </FormHelperText>
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>

            <Controller
              control={control}
              name="meta"
              render={({ field: { onChange, value } }) => (
                <Box w="100%">
                  <ErrorProvider>
                    <FormBuilder<Static<typeof pageMetaSchema>>
                      schema={pageMetaSchema}
                      validateFn={validateFn}
                      data={value}
                      handleChange={onChange}
                    />
                  </ErrorProvider>
                </Box>
              )}
            />
          </VStack>
        </GridItem>
        <GridItem colSpan={1}></GridItem>
      </Grid>
    </form>
  )
}

PageSettings.getLayout = PageEditingLayout

export default PageSettings
