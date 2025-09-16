import type { z } from "zod"
import { HStack, Text, VStack } from "@chakra-ui/react"
import { Badge } from "@opengovsg/design-system-react"
import { format } from "date-fns"
import { useFormContext } from "react-hook-form"

import type { schedulePublishClientSchema } from "~/schemas/schedule"

export interface QuickSelectTime {
  hours: number
  minutes: number
}

/**
 * The times to display as 'quick-select-times' under the date/time picker
 */
const QUICK_SELECT_TIMES: QuickSelectTime[] = [
  { hours: 0, minutes: 0 },
  { hours: 9, minutes: 0 },
  { hours: 13, minutes: 0 },
  { hours: 17, minutes: 0 },
]

export const QuickSelectTimeSection = ({
  earliestAllowableTime,
}: {
  earliestAllowableTime: QuickSelectTime | null
}) => {
  // filter out the time if it is before the earliest allowable time
  // since both are kept as {hours, minutes}, we don't need to convert them to Date objects
  const optionsToShow = QUICK_SELECT_TIMES.filter(({ hours, minutes }) => {
    if (!earliestAllowableTime) return true
    return (
      hours > earliestAllowableTime.hours ||
      (hours === earliestAllowableTime.hours &&
        minutes >= earliestAllowableTime.minutes)
    )
  })

  const { setValue } =
    useFormContext<z.input<typeof schedulePublishClientSchema>>()
  return (
    <>
      {optionsToShow.length > 0 && (
        <VStack align="stretch" spacing="0.5rem">
          <Text textStyle="caption-2">Quick select a time?</Text>
          <HStack spacing="0.5rem">
            {optionsToShow.map((time) => {
              const date = new Date()
              date.setHours(time.hours, time.minutes, 0, 0)
              const displayFormatted = format(date, "h:mm a")
              const valueFormatted = format(date, "HH:mm")
              return (
                <Badge
                  key={displayFormatted}
                  variant="outline"
                  cursor="pointer"
                  borderWidth="1px"
                  borderColor="blue.200"
                  onClick={() => setValue("publishTime", valueFormatted)}
                >
                  <Text textStyle="legal" color="interaction.main.default">
                    {displayFormatted}
                  </Text>
                </Badge>
              )
            })}
          </HStack>
        </VStack>
      )}
    </>
  )
}
