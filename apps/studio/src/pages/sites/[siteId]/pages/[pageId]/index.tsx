import { Grid, GridItem } from "@chakra-ui/react"

import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import EditPageDrawer from "~/features/editing-experience/components/EditPageDrawer"
import { EditPagePreview } from "~/features/editing-experience/components/EditPagePreview"
import { IframeToolbar } from "~/features/editing-experience/components/IframeToolbar"
import { editPageSchema } from "~/features/editing-experience/schema"
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
        <IframeToolbar />
        <EditPagePreview />
      </GridItem>
    </Grid>
  )
}

EditPage.getLayout = PageEditingLayout

export default EditPage
