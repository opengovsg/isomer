import { useEffect } from "react"
import { Grid, GridItem } from "@chakra-ui/react"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import EditPageDrawer from "~/features/editing-experience/components/EditPageDrawer"
import Preview from "~/features/editing-experience/components/Preview"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { trpc } from "~/utils/trpc"

function EditPage(): JSX.Element {
  const {
    setDrawerState,
    pageState,
    setPageState,
    setSnapshot: setEditorState,
  } = useEditorDrawerContext()

  const [{ content: page }] = trpc.page.readPageAndBlob.useSuspenseQuery({
    pageId: 1,
  })

  useEffect(() => {
    setDrawerState({
      state: "root",
    })
    const blocks = page.content
    setPageState(blocks)
  }, [page.content, setDrawerState, setEditorState, setPageState])

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
      <GridItem colSpan={2} overflow="scroll">
        {/* TODO: the version here should be obtained from the schema  */}
        {/* and not from the page */}
        <Preview {...page} version="0.1.0" content={pageState} />
      </GridItem>
    </Grid>
  )
}

EditPage.getLayout = PageEditingLayout

export default EditPage
