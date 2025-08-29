import type { FormatOptionLabelMeta } from "chakra-react-select"
import { Divider, Flex, Icon, Text } from "@chakra-ui/react"
import { format, isAfter, parse, set } from "date-fns"
import { range, sortBy } from "lodash"
import { BiTimeFive } from "react-icons/bi"

import type { BaseSelectOption, BaseSelectProps } from "./BaseSelect"
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

  const formatOptionLabel = (
    option: BaseSelectOption<string>,
    { context }: FormatOptionLabelMeta<BaseSelectOption<string>>,
  ) => {
    return (
      <Flex align="center" justify="space-between" w="100%" cursor="pointer">
        <Text>{option.label}</Text>
        {context === "value" && (
          <Text textStyle="caption-2" color="base.content.medium">
            SGT (GMT +8)
          </Text>
        )}
      </Flex>
    )
  }

  return (
    <BaseSelect
      value={value}
      options={options}
      placeholder="Select time"
      formatOptionLabel={formatOptionLabel}
      customComponents={{
        DropdownIndicator: () => {
          return (
            <Flex
              height="100%"
              w="2.75rem"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
            >
              <Icon as={BiTimeFive} boxSize="1.25rem" />
            </Flex>
          )
        },
        IndicatorSeparator: () => (
          <Divider
            h="100%"
            orientation="vertical"
            borderColor="base.divider.strong"
          />
        ),
      }}
      {...rest}
    />
  )
}
