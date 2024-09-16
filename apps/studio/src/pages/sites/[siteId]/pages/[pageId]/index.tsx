import {
  Box,
  Flex,
  Grid,
  GridItem,
  TabPanel,
  TabPanels,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Infobox, Input, useToast } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { isEmpty, merge } from "lodash"
import { Controller } from "react-hook-form"
import { BiLink } from "react-icons/bi"

import type { RouterOutput } from "~/utils/trpc"
import {
  EditorDrawerProvider,
  useEditorDrawerContext,
} from "~/contexts/EditorDrawerContext"
import EditPageDrawer from "~/features/editing-experience/components/EditPageDrawer"
import Preview from "~/features/editing-experience/components/Preview"
import { PreviewIframe } from "~/features/editing-experience/components/PreviewIframe"
import { generateResourceUrl } from "~/features/editing-experience/components/utils"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import {
  MAX_PAGE_URL_LENGTH,
  MAX_TITLE_LENGTH,
  pageSettingsSchema,
} from "~/schemas/page"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { trpc } from "~/utils/trpc"

function EditPage(): JSX.Element {
  const { pageId, siteId } = useQueryParse(editPageSchema)

  const [{ content: page, type, title, updatedAt }] =
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

  return (
    <TabPanels _dark={{ color: "white" }}>
      <TabPanel height="full">
        <EditorDrawerProvider
          initialPageState={page}
          type={type}
          permalink={permalink}
          siteId={siteId}
          pageId={pageId}
          updatedAt={updatedAt}
        >
          <PageEditingView title={title} />
        </EditorDrawerProvider>
      </TabPanel>
      <TabPanel>
        <PageSettings
          type={type}
          permalink={permalink.split("/").at(-1) || "/"}
          prefix={permalink.split("/").slice(0, -1).join("/")}
          title={title}
        />
      </TabPanel>
    </TabPanels>
  )
}

interface PageEditingViewProps {
  title: string
}
const PageEditingView = ({ title }: PageEditingViewProps) => {
  const { previewPageState, permalink, siteId, pageId, updatedAt } =
    useEditorDrawerContext()
  const themeCssVars = useSiteThemeCssVars({ siteId })

  return (
    <Grid
      h="full"
      w="100vw"
      templateColumns="repeat(3, 1fr)"
      gap={0}
      maxH="calc(100vh - 57px)"
    >
      {/* TODO: Implement sidebar editor */}
      <GridItem colSpan={1} bg="slate.50" overflow="auto">
        <EditPageDrawer />
      </GridItem>
      <GridItem colSpan={2}>
        <Flex
          shrink={0}
          justify="flex-start"
          p="2rem"
          bg="base.canvas.backdrop"
          h="100%"
          overflowX="auto"
        >
          <PreviewIframe style={themeCssVars}>
            <Preview
              {...merge(previewPageState, { page: { title } })}
              siteId={siteId}
              resourceId={pageId}
              permalink={permalink}
              lastModified={updatedAt}
              version="0.1.0"
            />
          </PreviewIframe>
        </Flex>
      </GridItem>
    </Grid>
  )
}

const THREE_SECONDS_IN_MS = 3000
const SUCCESS_TOAST_ID = "save-page-settings-success"

interface PageSettingsProps {
  permalink: RouterOutput["page"]["readPageAndBlob"]["permalink"]
  title: RouterOutput["page"]["readPageAndBlob"]["title"]
  type: RouterOutput["page"]["readPageAndBlob"]["type"]
  prefix?: string
}
const PageSettings = ({
  permalink: originalPermalink,
  type,
  title: originalTitle,
  prefix,
}: PageSettingsProps) => {
  const { pageId, siteId } = useQueryParse(editPageSchema)
  const { register, watch, control, reset, handleSubmit, formState } =
    useZodForm({
      schema: pageSettingsSchema.omit({ pageId: true, siteId: true }),
      defaultValues: {
        title: originalTitle || "",
        permalink: originalPermalink || "",
      },
    })

  const [title, permalink] = watch(["title", "permalink"])

  const toast = useToast({ duration: THREE_SECONDS_IN_MS, isClosable: true })
  const utils = trpc.useUtils()

  const updatePageSettingsMutation = trpc.page.updateSettings.useMutation({
    onSuccess: async () => {
      // TODO: we should use a specialised query for this rather than the general one that retrives the page and the blob
      await utils.page.readPageAndBlob.invalidate()
      await utils.page.readPage.invalidate()
      await utils.page.getFullPermalink.invalidate()
      if (!toast.isActive(SUCCESS_TOAST_ID)) {
        toast({
          id: SUCCESS_TOAST_ID,
          title: "Saved page settings",
          description: "Publish this page for your changes to go live.",
          status: "success",
        })
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to save page settings",
        description: error.message,
        status: "error",
      })
    },
  })

  const onSubmit = handleSubmit((values) => {
    if (!isEmpty(formState.dirtyFields)) {
      updatePageSettingsMutation.mutate(
        { pageId, siteId, ...values },
        {
          onSuccess: () => reset(values),
        },
      )
    }
  })

  const fullPermalink =
    type === ResourceType.RootPage ? "/" : `${prefix}/${permalink}`

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
            <Box w="full">
              <Text textStyle="subhead-1">Page URL</Text>
              <Controller
                control={control}
                name="permalink"
                render={({ field: { onChange, ...field } }) => (
                  <Input
                    mt="0.5rem"
                    isDisabled={type === ResourceType.RootPage}
                    placeholder="URL will be autopopulated if left untouched"
                    noOfLines={1}
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
                mt="0.5rem"
                icon={<BiLink />}
                variant="info-secondary"
                size="sm"
              >
                <Text noOfLines={1} textStyle="subhead-2">
                  {fullPermalink}
                </Text>
              </Infobox>
              <Text mt="0.5rem" textColor="base.content.medium">
                {MAX_PAGE_URL_LENGTH - permalink.length} characters left
              </Text>
            </Box>
            <Box w="full">
              <Text textStyle="subhead-1">Page title</Text>
              <Text textStyle="body-2" mt="0.25rem">
                By default, this is the title of your your page. Edit this if
                you want to show a different title on search engines.
              </Text>
              <Input
                w="100%"
                noOfLines={1}
                maxLength={MAX_TITLE_LENGTH}
                isDisabled={type === ResourceType.RootPage}
                {...register("title")}
                mt="0.5rem"
              />
              <Text mt="0.5rem" textColor="base.content.medium">
                {MAX_TITLE_LENGTH - title.length} characters left
              </Text>
            </Box>
          </VStack>
        </GridItem>
        <GridItem colSpan={1}></GridItem>
      </Grid>
    </form>
  )
}

EditPage.getLayout = PageEditingLayout

export default EditPage
