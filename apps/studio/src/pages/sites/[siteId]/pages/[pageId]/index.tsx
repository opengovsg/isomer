import { Grid, GridItem } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { NextPageWithLayout } from "~/lib/types"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { WithIntercomWrapper } from "~/components/Intercom"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import EditPageDrawer from "~/features/editing-experience/components/EditPageDrawer"
import { EditPagePreview } from "~/features/editing-experience/components/EditPagePreview"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { trpc } from "~/utils/trpc"

const EditPage: NextPageWithLayout = () => {
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
    <Grid h="full" w="100%" templateColumns="repeat(3, 1fr)" gap={0}>
      <GridItem colSpan={1} overflow="auto" minW="30rem">
        <EditPageDrawer />
      </GridItem>
      <GridItem colSpan={2}>
        <EditPagePreview />
      </GridItem>
    </Grid>
  )
}

EditPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.Page}
      page={
        <WithIntercomWrapper>{PageEditingLayout(page)}</WithIntercomWrapper>
      }
    />
  )
}

export default EditPage
