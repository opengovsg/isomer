import type { IconType } from "react-icons"
import { useMemo } from "react"
import NextLink from "next/link"
import { Badge, HStack, Icon, Text, Tooltip, VStack } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import { format } from "date-fns"
import { BiTimeFive } from "react-icons/bi"

import type { ResourceTableData } from "./types"
import { getLinkToResource } from "~/utils/resource"
import { getIcon } from "~/utils/resources"

export interface TitleCellProps
  extends Pick<
    ResourceTableData,
    "title" | "permalink" | "type" | "id" | "scheduledAt"
  > {
  siteId: number
}

export const TitleCell = ({
  title,
  permalink,
  type,
  siteId,
  id,
  scheduledAt,
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
          {scheduledAt && (
            <Tooltip
              label={format(scheduledAt, "MMMM d, yyyy h:mm a")}
              placement="bottom"
              hasArrow
            >
              <Badge
                bgColor="utility.feedback.info-subtle"
                color="utility.feedback.info"
                cursor="pointer"
              >
                <HStack spacing="0.25rem" align="center">
                  <Icon as={BiTimeFive} boxSize="0.75rem" />
                  <Text textStyle="legal">Scheduled</Text>
                </HStack>
              </Badge>
            </Tooltip>
          )}
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
