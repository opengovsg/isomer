import { useState } from "react"
import { Grid, GridItem } from "@chakra-ui/react"
import { format } from "date-fns"
import { z } from "zod"

import { CollectionLinkProps } from "~/features/editing-experience/atoms"
import { EditCollectionLinkPreview } from "~/features/editing-experience/components/EditLinkPreview"
import { LinkEditorDrawer } from "~/features/editing-experience/components/LinkEditorDrawer"
import { LinkEditingLayout } from "~/templates/layouts/LinkEditingLayout"

export const editLinkSchema = z.object({
  linkId: z.coerce.number().min(1),
  siteId: z.coerce.number().min(1),
})

export const EditLink = () => {
  const [link, setLink] = useState<CollectionLinkProps>({
    ref: "",
    description: "",
    date: format(new Date(), "dd/mm/yyyy"),
    category: "",
    title: "",
  })

  return (
    <Grid
      h="full"
      w="100%"
      templateColumns="repeat(3, 1fr)"
      gap={0}
      maxH="calc(100vh - 57px)"
    >
      <GridItem colSpan={1} overflow="auto" minW="30rem">
        <LinkEditorDrawer link={link} setLink={(props) => setLink(props)} />
      </GridItem>
      <GridItem colSpan={2}>
        <EditCollectionLinkPreview link={link} />
      </GridItem>
    </Grid>
  )
}

EditLink.getLayout = LinkEditingLayout

export default EditLink
