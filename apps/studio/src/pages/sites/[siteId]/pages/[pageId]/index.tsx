import { useEffect } from "react"
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Spacer,
  TabPanel,
  TabPanels,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { Input, Toggle } from "@opengovsg/design-system-react"
import { z } from "zod"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
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
  pageTitleSchema,
  permalinkSchema,
} from "~/schemas/page"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { RouterOutput, trpc } from "~/utils/trpc"

function EditPage(): JSX.Element {
  const { setDrawerState, setSavedPageState, setPreviewPageState } =
    useEditorDrawerContext()
  const { pageId, siteId } = useQueryParse(editPageSchema)

  const [{ content: page, permalink }] =
    trpc.page.readPageAndBlob.useSuspenseQuery(
      {
        pageId,
        siteId,
      },
      { refetchOnWindowFocus: false },
    )

  useEffect(() => {
    setDrawerState({
      state: "root",
    })
    setSavedPageState(page)
    setPreviewPageState(page)
  }, [page, setDrawerState, setPreviewPageState, setSavedPageState])

  return (
    <TabPanels _dark={{ color: "white" }}>
      <TabPanel height="full">
        <PageEditingView
          pageId={pageId}
          permalink={permalink}
          page={page}
          siteId={siteId}
        />
      </TabPanel>
      <TabPanel>
        <PageSettings permalink={permalink} page={page} />
      </TabPanel>
    </TabPanels>
  )
}

interface PageEditingViewProps extends z.infer<typeof editPageSchema> {
  page: RouterOutput["page"]["readPageAndBlob"]["content"]
  permalink: RouterOutput["page"]["readPageAndBlob"]["permalink"]
}

const PageEditingView = ({ page, permalink, siteId }: PageEditingViewProps) => {
  const { previewPageState } = useEditorDrawerContext()
  const themeCssVars = useSiteThemeCssVars({ siteId })

  return (
    <Grid
      h="full"
      w="100vw"
      templateColumns="repeat(3, 1fr)"
      gap={0}
      maxH="calc(100vh - 57px)"
    >
      <GridItem colSpan={1} bg="slate.50">
        <EditPageDrawer />
      </GridItem>
      <GridItem colSpan={2}>
        <Flex
          shrink={0}
          justify="flex-start"
          p="2rem"
          bg="gray.100"
          h="100%"
          overflowX="auto"
        >
          <PreviewIframe style={themeCssVars}>
            <Preview
              {...page}
              {...previewPageState}
              siteId={siteId}
              permalink={permalink}
              version="0.1.0"
            />
          </PreviewIframe>
        </Flex>
      </GridItem>
    </Grid>
  )
}

const pageSettingsSchema = z.object({
  title: pageTitleSchema,
  meta: z.string().optional(),
  permalink: permalinkSchema,
  noIndex: z.boolean().optional(),
})

interface PageSettingsProps {
  permalink: RouterOutput["page"]["readPageAndBlob"]["permalink"]
  page: RouterOutput["page"]["readPageAndBlob"]["content"]
}
const PageSettings = ({
  permalink: originalPermalink,
  page,
}: PageSettingsProps) => {
  const { register, setValue, getFieldState, watch } = useZodForm({
    schema: pageSettingsSchema,
    defaultValues: {
      title: page.page.title || "",
      permalink: originalPermalink || "",
    },
  })

  const [title, permalink] = watch(["title", "permalink"])

  useEffect(() => {
    const permalinkFieldState = getFieldState("permalink")
    // This allows the syncing to happen only when the page title is not dirty
    // Dirty means user has changed the value AND the value is not the same as the default value of "".
    // Once the value has been cleared, dirty state will reset.
    if (!permalinkFieldState.isDirty) {
      setValue("permalink", generateResourceUrl(title), {
        shouldValidate: !!title,
      })
    }
  }, [getFieldState, setValue, title])

  return (
    <Box w="max-content" m="3rem auto">
      <VStack w="100%" gap="2rem" alignItems="flex-start">
        <Box>
          <Text as="h3" textStyle="h3-semibold">
            Page settings
          </Text>
          <Text textStyle="body-2" mt="0.5rem">
            These settings will only affect this page. Publish the page to make
            these changes live.
          </Text>
        </Box>
        <Box w="full">
          <Text textStyle="subhead-1">Page URL</Text>
          <Text noOfLines={1} maxW="100%" textStyle="body-2">
            {permalink}
          </Text>
          <Input
            noOfLines={1}
            mt="0.5rem"
            {...register("permalink")}
            w="100%"
          />
          <Text mt="0.5rem" textColor="base.content.medium">
            {MAX_PAGE_URL_LENGTH - permalink.length} characters left
          </Text>
        </Box>
        <Box>
          <Text textStyle="h5" as="h5">
            Search Engine Optimisation (Advanced)
          </Text>
          <Text textStyle="body-2">
            Settings here will affect how your page appears on search engines
            like Google.
          </Text>
        </Box>
      </VStack>
      <VStack alignItems="flex-start" gap="1.5rem" mt="1.5rem" w="100%">
        <Flex w="full">
          <Box w="full">
            <Toggle
              {...register("noIndex")}
              label="Prevent search engines from indexing this page"
            />
            <Text textStyle="body-2">
              If this is on, your visitors can't find this page through a search
              engine.
            </Text>
          </Box>
          <Spacer />
        </Flex>
        <Box w="full">
          <Text textStyle="subhead-1">Page title</Text>
          <Text textStyle="body-2" mt="0.25rem">
            By default, this is the title of your your page. Edit this if you
            want to show a different title on search engines.
          </Text>
          <Input w="100%" noOfLines={1} {...register("title")} mt="0.5rem" />
          <Text mt="0.5rem" textColor="base.content.medium">
            {MAX_TITLE_LENGTH - title.length} characters left
          </Text>
        </Box>
        <Box>
          <Text textStyle="subhead-1">Meta description</Text>
          <Text textStyle="body-2">
            This is a summary of your page that is displayed on search results.
            By default, this is the summary of your page.
          </Text>
          <Textarea mt="0.5rem" {...register("meta")} />
        </Box>
      </VStack>
    </Box>
  )
}

EditPage.getLayout = PageEditingLayout

export default EditPage
