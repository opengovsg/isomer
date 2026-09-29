import type { IconType } from "react-icons"
import {
  HStack,
  Icon,
  LinkOverlay,
  Text,
  useStyleConfig,
  VStack,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { useMemo } from "react"
import { DraftIndicator } from "~/components/DraftIndicator"
import { getLinkToResource } from "~/utils/resource"
import { getIcon } from "~/utils/resources"

import type { ResourceTableData } from "./types"

interface TitleCellProps extends Pick<
  ResourceTableData,
  "title" | "permalink" | "type" | "id" | "draftBlobId"
> {
  siteId: number
}

export const TitleCell = ({
  title,
  permalink,
  type,
  siteId,
  id,
  draftBlobId,
}: TitleCellProps): JSX.Element => {
  const linkStyles = useStyleConfig("Link", {
    colorScheme: "neutral",
    variant: "standalone",
  })

  const linkToResource: string = useMemo(() => {
    return getLinkToResource({ resourceId: id, siteId, type })
  }, [id, siteId, type])

  const ResourceTypeIcon: IconType = useMemo(() => {
    return getIcon(type)
  }, [type])

  return (
    <HStack align="center" spacing="0.625rem">
      <Icon
        fontSize="1.25rem"
        as={ResourceTypeIcon}
        color="base.content.strong"
      />
      <VStack spacing="0.25rem" align="start">
        <HStack align="center" spacing="0.75rem">
          <LinkOverlay
            as={NextLink}
            href={linkToResource}
            title={title}
            noOfLines={1}
            sx={{
              ...linkStyles,
              position: "static",
              p: 0,
              textStyle: "subhead-2",
            }}
          >
            {title}
          </LinkOverlay>
          <DraftIndicator draftBlobId={draftBlobId} />
        </HStack>
        {permalink && (
          <Text
            title={permalink}
            noOfLines={1}
            textStyle="caption-2"
            color="base.content.medium"
          >
            {permalink}
          </Text>
        )}
      </VStack>
    </HStack>
  )
}
