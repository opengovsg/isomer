import { Box, Text } from "@chakra-ui/react"

import { editPageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { getReferenceLink, getResourceIdFromReferenceLink } from "~/utils/link"
import { trpc } from "~/utils/trpc"
import { ResourceSelector } from "../ResourceSelector"

interface PageLinkElementProps {
  value: string
  onChange: (value: string) => void
}

export const PageLinkElement = ({ value, onChange }: PageLinkElementProps) => {
  const { siteId } = useQueryParse(editPageSchema)

  const selectedResourceId = getResourceIdFromReferenceLink(value)

  const { data: resource } = trpc.resource.getWithFullPermalink.useQuery({
    resourceId: selectedResourceId,
  })

  return (
    <>
      <ResourceSelector
        siteId={String(siteId)}
        onChange={(resourceId) =>
          onChange(getReferenceLink({ siteId: String(siteId), resourceId }))
        }
        selectedResourceId={selectedResourceId}
      />

      {!!resource && (
        <Box bg="utility.feedback.info-subtle" p="0.75rem" w="full" mt="0.5rem">
          <Text textStyle="caption-1">
            You selected /{resource.fullPermalink}
          </Text>
        </Box>
      )}
    </>
  )
}
