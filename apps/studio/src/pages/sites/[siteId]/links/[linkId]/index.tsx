import { useMemo, useState } from "react"
import { Grid, GridItem } from "@chakra-ui/react"
import { z } from "zod"

import { EditCollectionLinkPreview } from "~/features/editing-experience/components/EditLinkPreview"
import { LinkEditorDrawer } from "~/features/editing-experience/components/LinkEditorDrawer"
import { useQueryParse } from "~/hooks/useQueryParse"
import { CollectionLinkProps } from "~/schemas/collection"
import { LinkEditingLayout } from "~/templates/layouts/LinkEditingLayout"
import { trpc } from "~/utils/trpc"

export const editLinkSchema = z.object({
  linkId: z.coerce.number().min(1),
  siteId: z.coerce.number().min(1),
})

export const EditLink = () => {
  const { linkId, siteId } = useQueryParse(editLinkSchema)

  const [{ content, title }] =
    trpc.collection.readCollectionLink.useSuspenseQuery(
      {
        linkId,
        siteId,
      },
      {
        refetchOnWindowFocus: false,
      },
    )

  const initialLinkState = useMemo(
    () => ({
      ref: "",
      category: "",
      ...content.page,
    }),
    [content.page, title],
  )

  const [link, setLink] = useState<CollectionLinkProps>(initialLinkState)

  return (
    <Grid
      h="full"
      w="100%"
      templateColumns="repeat(3, 1fr)"
      gap={0}
      maxH="calc(100vh - 57px)"
    >
      <GridItem colSpan={1} overflow="auto" minW="30rem">
        <LinkEditorDrawer
          link={link}
          setLink={setLink}
          initialLinkState={initialLinkState}
        />
      </GridItem>
      <GridItem colSpan={2}>
        <EditCollectionLinkPreview link={link} title={title} />
      </GridItem>
    </Grid>
  )
}

EditLink.getLayout = LinkEditingLayout

export default EditLink
