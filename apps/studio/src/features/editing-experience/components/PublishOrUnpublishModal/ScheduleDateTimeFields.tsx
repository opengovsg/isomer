import { FormControl, HStack } from "@chakra-ui/react"
import {
  DatePicker,
  FormErrorMessage,
  FormLabel,
} from "@opengovsg/design-system-react"
import { isBefore, startOfDay } from "date-fns"
import { useEffect, useMemo } from "react"
import { Controller, useFormContext } from "react-hook-form"
import {
  parseTimeStringToDate,
  TimeSelect,
} from "~/components/Select/TimeSelect"

import { getEarliestAllowableTime } from "../PublishingModal/utils"

interface ScheduleDateTimeFieldsProps {
  // Field names differ between the publish and unpublish schemas, so the
  // caller passes whichever pair applies.
  dateField: string
  timeField: string
  earliestSchedule: Date
}

export const ScheduleDateTimeFields = ({
  dateField,
  timeField,
  earliestSchedule,
}: ScheduleDateTimeFieldsProps) => {
  const {
    resetField,
    watch,
    control,
    formState: { errors },
  } = useFormContext()

  const selectedDate = watch(dateField) as Date
  const selectedTime = watch(timeField) as string | undefined

  const earliestAllowableTime = useMemo(
    () => getEarliestAllowableTime(selectedDate, earliestSchedule),
    [selectedDate, earliestSchedule],
  )

  // Selecting an earlier date can leave a previously-picked time out of
  // range; reset it so the user re-enters a valid one.
  useEffect(() => {
    if (
      earliestAllowableTime &&
      selectedTime &&
      isBefore(parseTimeStringToDate(selectedTime), earliestSchedule)
    ) {
      resetField(timeField)
    }
  }, [
    earliestAllowableTime,
    selectedTime,
    earliestSchedule,
    resetField,
    timeField,
  ])

  return (
    <HStack spacing="1.5rem" w="100%" alignItems="flex-start">
      <FormControl isInvalid={!!errors[dateField]} flexGrow={1}>
        <FormLabel isRequired>Date</FormLabel>
        <Controller
          name={dateField}
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              size="sm"
              shouldSetDateOnTodayButtonClick={true}
              isDateUnavailable={(date) =>
                isBefore(startOfDay(date), startOfDay(earliestSchedule))
              }
            />
          )}
        />
        <FormErrorMessage>
          {errors[dateField]?.message as string | undefined}
        </FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!errors[timeField]} flexGrow={1}>
        <FormLabel isRequired>Time</FormLabel>
        <Controller
          name={timeField}
          control={control}
          render={({ field }) => (
            <TimeSelect
              earliestAllowableTime={earliestAllowableTime}
              size="sm"
              {...field}
            />
          )}
        />
        <FormErrorMessage>
          {errors[timeField]?.message as string | undefined}
        </FormErrorMessage>
      </FormControl>
    </HStack>
  )
}
