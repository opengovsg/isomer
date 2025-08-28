import { format, isAfter, parse, set } from "date-fns"
import { range, sortBy } from "lodash"

import type { BaseSelectProps } from "./BaseSelect"
import { BaseSelect } from "./BaseSelect"

interface TimeSelectProps extends Omit<BaseSelectProps<string>, "options"> {
  earliestAllowableTime?: { hours: number; minutes: number } // in 24-hour format
}

export const TimeSelect = ({
  value,
  earliestAllowableTime,
  ...rest
}: TimeSelectProps) => {
  const r = range(0, 24)

  const options = r
    .flatMap((hour) => {
      const currentHalfHourString = hour.toString().padStart(2, "0")
      const currentHourString = hour.toString().padStart(2, "0")
      return sortBy(
        [
          {
            value: `${currentHourString}:00`,
            label: format(
              parse(`${currentHourString}:00`, "HH:mm", new Date()),
              "hh:mm a",
            ),
          },
          {
            value: `${currentHalfHourString}:30`,
            label: format(
              parse(`${currentHalfHourString}:30`, "HH:mm", new Date()),
              "hh:mm a",
            ),
          },
        ],
        (v) => v.value,
      )
    })
    .filter((option) => {
      if (!earliestAllowableTime) return true
      const [hour, minute] = option.value.split(":").map(Number)
      const optionTime = set(new Date(), {
        hours: hour,
        minutes: minute,
        seconds: 0,
        milliseconds: 0,
      })
      // Build the earliest allowable time
      const allowableTime = set(new Date(optionTime), {
        hours: earliestAllowableTime.hours,
        minutes: earliestAllowableTime.minutes,
        seconds: 0,
        milliseconds: 0,
      })
      return isAfter(optionTime, allowableTime)
    })

  return (
    <BaseSelect
      value={value}
      options={options}
      placeholder="Select time"
      {...rest}
    />
  )
}
