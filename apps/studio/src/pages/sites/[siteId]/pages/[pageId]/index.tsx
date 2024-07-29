import { useEffect } from "react"
import { Box, Flex, Grid, GridItem } from "@chakra-ui/react"
import Frame from "react-frame-component"
import { z } from "zod"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import EditPageDrawer from "~/features/editing-experience/components/EditPageDrawer"
import Preview from "~/features/editing-experience/components/Preview"
import { useQueryParse } from "~/hooks/useQueryParse"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { trpc } from "~/utils/trpc"

export const editPageSchema = z.object({
  pageId: z.coerce.number(),
  siteId: z.coerce.number(),
})

function EditPage(): JSX.Element {
  const {
    setDrawerState,
    previewPageState,
    setSavedPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()
  const { pageId, siteId } = useQueryParse(editPageSchema)

  const [{ content: page, permalink }] =
    trpc.page.readPageAndBlob.useSuspenseQuery({
      pageId,
      siteId,
    })

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
      <GridItem colSpan={2} overflow="auto">
        <Box p="2rem" bg="gray.100" h="100%">
          <Flex
            borderRadius="8px"
            bg="white"
            shadow="md"
            overflow="auto"
            h="100%"
          >
            <Frame
              style={{
                flexGrow: 1,
                border: "none",
                margin: 0,
                padding: 0,
              }}
              initialContent='<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="/assets/css/preview-tw.css" /></head><body><div id="preview-mount"></div></body></html>'
              mountTarget="#preview-mount"
            >
              <Preview
                siteId={siteId}
                {...page}
                permalink={permalink}
                version="0.1.0"
                content={previewPageState}
              />
            </Frame>
          </Flex>
        </Box>
      </GridItem>
    </Grid>
  )
}

EditPage.getLayout = PageEditingLayout

export default EditPage
