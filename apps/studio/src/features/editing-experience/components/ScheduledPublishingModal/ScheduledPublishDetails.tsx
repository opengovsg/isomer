import type { z } from "zod"
import { useMemo } from "react"
import { FormControl, HStack, VStack } from "@chakra-ui/react"
import {
  DatePicker,
  FormErrorMessage,
  FormLabel,
} from "@opengovsg/design-system-react"
import { add, isBefore, parse, startOfDay } from "date-fns"
import { Controller, useFormContext } from "react-hook-form"

import type { schedulePublishClientSchema } from "~/schemas/schedule"
import { TimeSelect } from "~/components/Select/TimeSelect"
import { MINIMUM_SCHEDULE_LEAD_TIME_MINUTES } from "~/schemas/schedule"
import { QuickSelectTimeSection } from "./QuickSelectTimeSection"
import { getEarliestAllowableTime } from "./utils"

export const SchedulePublishDetails = () => {
  const {
    resetField,
    watch,
    control,
    formState: { errors },
  } = useFormContext<z.input<typeof schedulePublishClientSchema>>()

  const publishDate = watch("publishDate")
  const publishTime = watch("publishTime")
  // this is the earliest date and time that the user can schedule a publish for
  const { earliestAllowableTime, earliestSchedule } = useMemo(() => {
    const earliestSchedule = add(new Date(), {
      minutes: MINIMUM_SCHEDULE_LEAD_TIME_MINUTES,
    })
    const earliestAllowableTime = getEarliestAllowableTime(
      publishDate,
      earliestSchedule,
    )
    // if there is an earliest allowable time and the indicated publish time is out of range
    // reset the publish time to make the user re-input the time
    if (
      earliestAllowableTime &&
      publishTime &&
      isBefore(parse(publishTime, "HH:mm", new Date()), earliestSchedule)
    ) {
      resetField("publishTime")
    }
    return {
      earliestSchedule,
      earliestAllowableTime,
    }
  }, [publishDate, publishTime, resetField])

  return (
    <VStack align="stretch" spacing="0.5rem">
      <HStack spacing="1.5rem" w="100%" alignItems="flex-start">
        <FormControl isInvalid={!!errors.publishDate} flexGrow={1}>
          <FormLabel isRequired>Date</FormLabel>
          <Controller
            name="publishDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                size="sm"
                shouldSetDateOnTodayButtonClick={true}
                isDateUnavailable={(date) => {
                  return isBefore(
                    startOfDay(date),
                    startOfDay(earliestSchedule),
                  )
                }}
              />
            )}
          />
          <FormErrorMessage>{errors.publishDate?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.publishTime} flexGrow={1}>
          <FormLabel isRequired>Time</FormLabel>
          <Controller
            name="publishTime"
            control={control}
            render={({ field }) => (
              <TimeSelect
                {...field}
                size="sm"
                earliestAllowableTime={earliestAllowableTime}
              />
            )}
          />
          <FormErrorMessage>{errors.publishTime?.message}</FormErrorMessage>
        </FormControl>
      </HStack>
      <QuickSelectTimeSection earliestAllowableTime={earliestAllowableTime} />
    </VStack>
  )
}
