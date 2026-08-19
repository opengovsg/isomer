import type { IconType } from "react-icons"
import {
  Badge,
  HStack,
  Icon,
  LinkOverlay,
  Text,
  Tooltip,
  useStyleConfig,
  VStack,
} from "@chakra-ui/react"
import { format } from "date-fns"
import NextLink from "next/link"
import { useMemo } from "react"
import { BiTimeFive } from "react-icons/bi"
import { getLinkToResource } from "~/utils/resource"
import { getIcon } from "~/utils/resources"

import type { ResourceTableData } from "./types"

interface TitleCellProps extends Pick<
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
  const scheduledAtLabel = scheduledAt
    ? format(scheduledAt, "MMMM d, yyyy h:mm a")
    : undefined

  return (
    <HStack align="center" spacing="0.625rem">
      <Icon
        fontSize="1.25rem"
        as={ResourceTypeIcon}
        color="base.content.strong"
      />
      <VStack spacing="0.25rem" align="start">
        <HStack align="center" spacing="0.5rem">
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
          {scheduledAtLabel && (
            <Tooltip label={scheduledAtLabel} placement="bottom" hasArrow>
              <Badge
                as={NextLink}
                href={linkToResource}
                aria-label={`${title} is scheduled for ${scheduledAtLabel}`}
                bgColor="utility.feedback.info-subtle"
                color="utility.feedback.info"
                cursor="pointer"
                position="relative"
                zIndex={1}
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
