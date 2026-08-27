import type { IconType } from "react-icons"
import { HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useMemo } from "react"
import { HasDraftIndicator } from "~/features/dashboard/components/HasDraftIndicator"
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
        <HStack align="center" spacing="0.5rem">
          <Link
            as={NextLink}
            href={linkToResource}
            title={title}
            textStyle="subhead-2"
            noOfLines={1}
            p="0"
            variant="standalone"
            colorScheme="neutral"
          >
            {title}
          </Link>
          <HasDraftIndicator draftBlobId={draftBlobId} />
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
