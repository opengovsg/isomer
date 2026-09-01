import type { RouterOutput } from "~/utils/trpc"
import { Badge, Box, HStack, Icon, Text, Tooltip } from "@chakra-ui/react"
import {
  Badge as PillBadge,
  BadgeLeftIcon,
} from "@opengovsg/design-system-react"
import { format } from "date-fns"
import { BiSolidCircle, BiTimeFive } from "react-icons/bi"
import { ScheduledAction } from "~prisma/generated/generatedEnums"

type LiveStatus =
  RouterOutput["resource"]["listWithoutRoot"][number]["liveStatus"]

interface LiveStatusBadgesProps {
  liveStatus: LiveStatus
  scheduledAt: Date | null
  scheduledAction: ScheduledAction | null
  // The resource's most recent publish, regardless of current live status —
  // null if it's never been published.
  lastPublishedAt: Date | null
}

const LIVE_STATUS_CONFIG: Record<
  LiveStatus,
  { label: string; colorScheme: string }
> = {
  live: { label: "Published", colorScheme: "success" },
  liveTemplate: { label: "Live · Template", colorScheme: "success" },
  notLive: { label: "Unpublished", colorScheme: "neutral" },
}

export const LiveStatusBadges = ({
  liveStatus,
  scheduledAt,
  scheduledAction,
  lastPublishedAt,
}: LiveStatusBadgesProps): JSX.Element => {
  const { label, colorScheme } = LIVE_STATUS_CONFIG[liveStatus]

  const livePill = (
    <PillBadge size="xs" variant="subtle" colorScheme={colorScheme}>
      <BadgeLeftIcon fontSize="0.5rem" as={BiSolidCircle} />
      <Text textStyle="legal">{label}</Text>
    </PillBadge>
  )

  return (
    <HStack spacing="0.5rem">
      {liveStatus !== "notLive" && lastPublishedAt ? (
        <Tooltip
          label={`Last published on ${format(lastPublishedAt, "MMMM d, yyyy h:mm a")}`}
          placement="bottom"
          hasArrow
        >
          {/* PillBadge (design-system-react's Badge) doesn't forward its ref,
          so Tooltip can't measure it for positioning without this wrapper —
          without it the tooltip renders pinned to the viewport's top-left. */}
          <Box as="span" display="inline-block">
            {livePill}
          </Box>
        </Tooltip>
      ) : (
        livePill
      )}
      {scheduledAt && (
        <Tooltip
          label={
            <>
              {scheduledAction === ScheduledAction.Unpublish
                ? "Will be unpublished on"
                : "Will be published on"}
              <br />
              {format(scheduledAt, "MMMM d, yyyy h:mm a")}
            </>
          }
          placement="bottom"
          hasArrow
        >
          <Badge
            // Scheduled-to-unpublish is styled to match the "Not live" pill,
            // since that's where the page is headed; scheduled-to-publish
            // keeps the info-blue treatment.
            bgColor={
              scheduledAction === ScheduledAction.Unpublish
                ? "interaction.neutral-subtle.default"
                : "utility.feedback.info-subtle"
            }
            color={
              scheduledAction === ScheduledAction.Unpublish
                ? "interaction.sub.default"
                : "utility.feedback.info"
            }
            cursor="pointer"
          >
            <HStack spacing="0.25rem" align="center">
              <Icon as={BiTimeFive} boxSize="0.75rem" />
              <Text textStyle="legal">
                {scheduledAction === ScheduledAction.Unpublish
                  ? "Scheduled to unpublish"
                  : "Scheduled to publish"}
              </Text>
            </HStack>
          </Badge>
        </Tooltip>
      )}
    </HStack>
  )
}
