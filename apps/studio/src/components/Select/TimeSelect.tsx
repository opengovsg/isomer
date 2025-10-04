import type { FormatOptionLabelMeta, SelectInstance } from "chakra-react-select"
import React from "react"
import { Divider, Flex, Icon, Text } from "@chakra-ui/react"
import { format, isBefore, set } from "date-fns"
import { BiTimeFive } from "react-icons/bi"

import type { BaseSelectOption, BaseSelectProps } from "./BaseSelect"
import { BaseSelect } from "./BaseSelect"

interface TimeSelectProps extends Omit<BaseSelectProps<string>, "options"> {
  earliestAllowableTime?: Date | null // in 24-hour format
  minutesStep?: number // e.g. 10, 15, 30, determines granularity of time options
}

export const TimeSelect = React.forwardRef<
  SelectInstance<BaseSelectOption<string>>,
  TimeSelectProps
>(
  (
    {
      value,
      earliestAllowableTime,
      minutesStep = 30,
      ...rest
    }: TimeSelectProps,
    ref,
  ) => {
    // Validate and constrain minutesStep to be between 1 and 60, and round up to nearest integer
    const validatedMinutesStep = Math.max(
      1,
      Math.min(60, Math.ceil(minutesStep)),
    ) // constrain to 1-60
    // Based on the granularity, determine how many time slots to generate
    const totalSlots = (24 * 60) / validatedMinutesStep

    // Generate all time slots in a day
    const options = Array.from({ length: totalSlots }).flatMap((_, i) => {
      const minutesOfDay = i * validatedMinutesStep
      const optionTime = set(new Date(), {
        hours: Math.floor(minutesOfDay / 60),
        minutes: minutesOfDay % 60,
        seconds: 0,
        milliseconds: 0,
      })
      return {
        value: format(optionTime, "HH:mm"),
        label: format(optionTime, "hh:mm a"),
      }
    })

    const filteredOptions = options.filter((option) => {
      if (!earliestAllowableTime) return true
      const [hour, minute] = option.value.split(":").map(Number)
      const optionTime = set(new Date(), {
        hours: hour,
        minutes: minute,
        seconds: 0,
        milliseconds: 0,
      })
      return !isBefore(optionTime, earliestAllowableTime)
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
        ref={ref}
        value={value}
        options={filteredOptions}
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
  },
)
