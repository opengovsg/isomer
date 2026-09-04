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
  RouterOutput["resource"]["listWithoutRoot"]["items"][number]["liveStatus"]

interface LiveStatusBadgesProps {
  liveStatus: LiveStatus
  scheduledAt: Date | null
  scheduledAction: ScheduledAction | null
  // The resource's most recent publish, regardless of current live status —
  // null if it's never been published.
  lastPublishedAt: Date | null
}

// liveTemplate (a Folder/Collection whose own landing page isn't published,
// but something nested inside it still is) is shown identically to live —
// callers no longer need to distinguish the two in the UI.
const LIVE_STATUS_CONFIG: Record<
  LiveStatus,
  // bgColor overrides the design system's own subtle-variant background,
  // which is lighter than the design here calls for.
  { label: string; colorScheme: string; bgColor?: string }
> = {
  live: {
    label: "Published",
    colorScheme: "success",
    bgColor: "interaction.success-subtle.default",
  },
  liveTemplate: {
    label: "Published",
    colorScheme: "success",
    bgColor: "interaction.success-subtle.default",
  },
  notLive: { label: "Unpublished", colorScheme: "neutral" },
}

export const LiveStatusBadges = ({
  liveStatus,
  scheduledAt,
  scheduledAction,
  lastPublishedAt,
}: LiveStatusBadgesProps): JSX.Element => {
  const { label, colorScheme, bgColor } = LIVE_STATUS_CONFIG[liveStatus]

  const livePill = (
    <PillBadge
      size="xs"
      variant="subtle"
      colorScheme={colorScheme}
      bgColor={bgColor}
    >
      <BadgeLeftIcon fontSize="0.5rem" as={BiSolidCircle} />
      <Text textStyle="legal">{label}</Text>
    </PillBadge>
  )

  return (
    <HStack spacing="0.5rem">
      {liveStatus !== "notLive" && lastPublishedAt ? (
        <Tooltip
          label={`Last published on ${format(lastPublishedAt, "d MMM yyyy, h:mma")}`}
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
              {format(scheduledAt, "d MMM yyyy, h:mma")}
            </>
          }
          placement="bottom"
          hasArrow
        >
          <Badge
            // Scheduled-to-unpublish is styled to match the "Not live" pill,
            // since that's where the page is headed; scheduled-to-publish
            // matches the "Published" pill's background.
            bgColor={
              scheduledAction === ScheduledAction.Unpublish
                ? "interaction.neutral-subtle.default"
                : "interaction.success-subtle.default"
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
