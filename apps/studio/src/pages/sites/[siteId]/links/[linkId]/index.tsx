import { Grid, GridItem } from "@chakra-ui/react"
import { z } from "zod"

import { EditLinkPreview } from "~/features/editing-experience/components/EditLinkPreview"
import { LinkEditorDrawer } from "~/features/editing-experience/components/LinkEditorDrawer"
import { LinkEditingLayout } from "~/templates/layouts/LinkEditingLayout"

export const editLinkSchema = z.object({
  linkId: z.coerce.number().min(1),
  siteId: z.coerce.number().min(1),
})

function EditLink(): JSX.Element {
  // put the forms and state here?
  // then inside i just call
  // i can set the default state to be correct here actually
  return <LinkEditingView />
}

const LinkEditingView = () => {
  return (
    <Grid
      h="full"
      w="100vw"
      templateColumns="repeat(3, 1fr)"
      gap={0}
      maxH="calc(100vh - 57px)"
    >
      <GridItem colSpan={1} overflow="auto" minW="30rem">
        <LinkEditorDrawer />
      </GridItem>
      <GridItem colSpan={2}>
        <EditLinkPreview />
      </GridItem>
    </Grid>
  )
}

EditLink.getLayout = LinkEditingLayout

export default EditLink
