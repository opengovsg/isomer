import type { Static } from "@sinclair/typebox"
import { useMemo } from "react"
import { Box, chakra, Grid, GridItem, Text, VStack } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { getLayoutMetadataSchema } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import Ajv from "ajv"
import { Controller } from "react-hook-form"
import { z } from "zod"

import type { NextPageWithLayout } from "~/lib/types"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { generateBasePermalinkSchema } from "~/schemas/common"
import { basePageSettingsSchema, MAX_PAGE_URL_LENGTH } from "~/schemas/page"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { trpc } from "~/utils/trpc"

const THREE_SECONDS_IN_MS = 3000
const SUCCESS_TOAST_ID = "save-page-settings-success"
const ajv = new Ajv({ strict: false, logger: false })

const PageSettings: NextPageWithLayout = () => {
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
    schema: basePageSettingsSchema.omit({ pageId: true, siteId: true }).extend({
      meta: z.unknown(),
      permalink: generateBasePermalinkSchema("page")
        .min(type === ResourceType.RootPage ? 0 : 1, {
          message: "Enter a URL for this page",
        })
        .max(MAX_PAGE_URL_LENGTH, {
          message: `Page URL should be shorter than ${MAX_PAGE_URL_LENGTH} characters.`,
        }),
    }),
    defaultValues: {
      title: originalTitle,
      permalink: permalinkTree[permalinkTree.length - 1] || "",
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
          type,
          ...rest,
        },
        {
          onSuccess: () => reset({ meta, ...rest }),
        },
      )
    }
  })

  return (
    <chakra.form onBlur={onSubmit} overflowY="auto" width="100%">
      <Grid w="100%" my="3rem" templateColumns="repeat(4, 1fr)">
        <GridItem gridColumn="2/4">
          <VStack w="100%" gap="2rem" alignItems="flex-start">
            <Box>
              <Text as="h3" textStyle="h3-semibold">
                Meta settings
              </Text>
              <Text textStyle="body-2" mt="0.5rem">
                These settings will only affect this page. Publish the page to
                make these changes live.
              </Text>
            </Box>

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
      </Grid>
    </chakra.form>
  )
}

PageSettings.getLayout = (page) => {
  return (
    <PermissionsBoundary resourceType="Page" page={PageEditingLayout(page)} />
  )
}

export default PageSettings
