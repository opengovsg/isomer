import { Flex, Grid, GridItem } from "@chakra-ui/react"
import merge from "lodash/merge"

import {
  EditorDrawerProvider,
  useEditorDrawerContext,
} from "~/contexts/EditorDrawerContext"
import EditPageDrawer from "~/features/editing-experience/components/EditPageDrawer"
import Preview from "~/features/editing-experience/components/Preview"
import { PreviewIframe } from "~/features/editing-experience/components/PreviewIframe"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { useQueryParse } from "~/hooks/useQueryParse"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { trpc } from "~/utils/trpc"

function EditPage(): JSX.Element {
  const { pageId, siteId } = useQueryParse(editPageSchema)

  const [{ content: page, type, updatedAt, title }] =
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
    <EditorDrawerProvider
      initialPageState={page}
      type={type}
      permalink={permalink}
      siteId={siteId}
      pageId={pageId}
      updatedAt={updatedAt}
      title={title}
    >
      <PageEditingView />
    </EditorDrawerProvider>
  )
}

const PageEditingView = () => {
  const { previewPageState, permalink, siteId, pageId, updatedAt, title } =
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

EditPage.getLayout = PageEditingLayout

export default EditPage
