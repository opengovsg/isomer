import type { Static } from "@sinclair/typebox"
import { Box, chakra, Grid, GridItem, Text, VStack } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { getLayoutMetadataSchema } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { Controller } from "react-hook-form"
import { z } from "zod"

import type { NextPageWithLayout } from "~/lib/types"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { ErrorProvider } from "~/features/editing-experience/components/form-builder/ErrorProvider"
import FormBuilder from "~/features/editing-experience/components/form-builder/FormBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { updatePageMetaSchema } from "~/schemas/page"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"

const SUCCESS_TOAST_ID = "save-page-settings-success"

const PageSettings: NextPageWithLayout = () => {
  const { pageId, siteId } = useQueryParse(pageSchema)
  const [{ content, type, updatedAt, title }] =
    trpc.page.readPageAndBlob.useSuspenseQuery(
      {
        pageId,
        siteId,
      },
      { refetchOnWindowFocus: false },
    )
  const [permalink] = trpc.page.getFullPermalink.useSuspenseQuery(
    {
      pageId,
      siteId,
    },
    { refetchOnWindowFocus: false },
  )

  const pageMetaSchema = getLayoutMetadataSchema(content.layout)
  const validateFn = ajv.compile<Static<typeof pageMetaSchema>>(pageMetaSchema)

  const {
    control,
    reset,
    handleSubmit,
    formState: { isDirty },
  } = useZodForm({
    schema: updatePageMetaSchema
      .omit({ resourceId: true, siteId: true })
      .extend({
        meta: z.unknown(),
      }),
    defaultValues: {
      meta: content.meta,
    },
  })

  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const utils = trpc.useUtils()

  const { mutate: updateMeta } = trpc.page.updateMeta.useMutation({
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
        title: "Saved page metadata",
        description: "Publish this page for your changes to go live.",
        status: "success",
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to save page metadata",
        description: error.message,
        status: "error",
      })
      reset()
    },
  })

  const onSubmit = handleSubmit(({ meta, ...rest }) => {
    if (isDirty) {
      updateMeta(
        {
          resourceId: String(pageId),
          siteId,
          meta: JSON.stringify(meta),
        },
        {
          onSuccess: () => reset({ meta, ...rest }),
        },
      )
    }
  })

  return (
    <EditorDrawerProvider
      initialPageState={content}
      type={type}
      permalink={permalink}
      siteId={siteId}
      pageId={pageId}
      updatedAt={updatedAt}
      title={title}
    >
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
    </EditorDrawerProvider>
  )
}

PageSettings.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.Page}
      page={PageEditingLayout(page)}
    />
  )
}

export default PageSettings
