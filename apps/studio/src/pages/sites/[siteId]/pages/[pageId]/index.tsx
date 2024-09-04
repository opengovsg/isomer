import { useEffect } from "react"
import { Flex, Grid, GridItem } from "@chakra-ui/react"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import EditPageDrawer from "~/features/editing-experience/components/EditPageDrawer"
import Preview from "~/features/editing-experience/components/Preview"
import { PreviewShadowDom } from "~/features/editing-experience/components/PreviewShadowDom"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { useQueryParse } from "~/hooks/useQueryParse"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { trpc } from "~/utils/trpc"

function EditPage(): JSX.Element {
  const {
    setDrawerState,
    previewPageState,
    setSavedPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()
  const { pageId, siteId } = useQueryParse(editPageSchema)

  const [{ content: page, permalink }] =
    trpc.page.readPageAndBlob.useSuspenseQuery(
      {
        pageId,
        siteId,
      },
      { refetchOnWindowFocus: false },
    )

  const themeCssVars = useSiteThemeCssVars({ siteId })

  useEffect(() => {
    setDrawerState({
      state: "root",
    })
    setSavedPageState(page)
    setPreviewPageState(page)
  }, [page, setDrawerState, setPreviewPageState, setSavedPageState])

  return (
    <Grid
      w="100vw"
      templateColumns="repeat(3, 1fr)"
      gap={0}
      maxH="calc(100vh - 57px)"
    >
      {/* TODO: Implement sidebar editor */}
      <GridItem colSpan={1} bg="slate.50">
        <EditPageDrawer />
      </GridItem>
      {/* TODO: Implement preview */}
      <GridItem colSpan={2}>
        <Flex
          shrink={0}
          justify="flex-start"
          p="2rem"
          bg="gray.100"
          h="100%"
          overflowX="auto"
        >
          <PreviewShadowDom style={themeCssVars}>
            <Preview
              {...page}
              {...previewPageState}
              siteId={siteId}
              permalink={permalink}
              version="0.1.0"
            />
          </PreviewShadowDom>
        </Flex>
      </GridItem>
    </Grid>
  )
}

EditPage.getLayout = PageEditingLayout

export default EditPage
