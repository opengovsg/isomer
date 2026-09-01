import { HStack, Icon, Text } from "@chakra-ui/react"
import { add, format } from "date-fns"
import { BiHourglass } from "react-icons/bi"
import { getTimezoneAbbreviation } from "~/lib/dates"

import type { PublishOrUnpublishAction } from "./ActionOptionsInput"

const UNPUBLISH_WINDOW_MINUTES = 10

interface ScheduleBannerProps {
  action: PublishOrUnpublishAction
  scheduledAt: Date
}

export const ScheduleBanner = ({
  action,
  scheduledAt,
}: ScheduleBannerProps) => {
  const dateText = (
    <Text display="inline" textStyle="subhead-2">
      {format(scheduledAt, "MMMM d, yyyy")}
    </Text>
  )
  const tzText = getTimezoneAbbreviation("long")

  return (
    <HStack
      spacing="0.5rem"
      alignItems="flex-start"
      bgColor="utility.feedback.info-subtle"
      borderRadius="0.25rem"
      p="0.75rem"
    >
      <Icon as={BiHourglass} boxSize="1rem" color="base.content.default" />
      <Text textStyle="body-2" color="base.content.strong" display="inline">
        {action === "publish" ? (
          <>
            We will publish this page at{" "}
            <Text display="inline" textStyle="subhead-2">
              {format(scheduledAt, "hh:mm a")}
            </Text>
            , {tzText}, on {dateText}. Changes will be live on your site
            approximately 5-10 minutes after publishing.
          </>
        ) : (
          <>
            This page will become unpublished between{" "}
            <Text display="inline" textStyle="subhead-2">
              {format(scheduledAt, "h:mm")} –{" "}
              {format(
                add(scheduledAt, { minutes: UNPUBLISH_WINDOW_MINUTES }),
                "h:mm a",
              )}
            </Text>
            , {tzText}, on {dateText}. It may still appear in search results
            until search engines next crawl your site.
          </>
        )}
      </Text>
    </HStack>
  )
}
