import type { RouterOutput } from "~/utils/trpc"
import { Badge, HStack, Icon, Text, Tooltip } from "@chakra-ui/react"
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
}

const LIVE_STATUS_CONFIG: Record<
  LiveStatus,
  { label: string; colorScheme: string }
> = {
  live: { label: "Live", colorScheme: "success" },
  liveTemplate: { label: "Live · Template", colorScheme: "success" },
  notLive: { label: "Not live", colorScheme: "neutral" },
}

export const LiveStatusBadges = ({
  liveStatus,
  scheduledAt,
  scheduledAction,
}: LiveStatusBadgesProps): JSX.Element => {
  const { label, colorScheme } = LIVE_STATUS_CONFIG[liveStatus]

  return (
    <HStack spacing="0.5rem">
      <PillBadge size="xs" variant="subtle" colorScheme={colorScheme}>
        <BadgeLeftIcon fontSize="0.5rem" as={BiSolidCircle} />
        <Text textStyle="legal">{label}</Text>
      </PillBadge>
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
