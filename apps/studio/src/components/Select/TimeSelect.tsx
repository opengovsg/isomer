import type { FormatOptionLabelMeta, SelectInstance } from "chakra-react-select"
import React from "react"
import { Divider, Flex, Icon, Text } from "@chakra-ui/react"
import { format, parse, set } from "date-fns"
import { BiTimeFive } from "react-icons/bi"

import type { BaseSelectOption, BaseSelectProps } from "./BaseSelect"
import { BaseSelect } from "./BaseSelect"

interface TimeSelectProps extends Omit<BaseSelectProps<string>, "options"> {
  size: "sm" | "md" | "lg"
  earliestAllowableTime?: Date | null // the earliest time that can be selected, if any
  minutesStep?: 5 | 10 | 15 | 20 | 30 | 60 // determines granularity of time options
}

export const TimeSelect = React.forwardRef<
  SelectInstance<BaseSelectOption<string>>,
  TimeSelectProps
>(
  (
    {
      value,
      earliestAllowableTime,
      minutesStep = 15,
      ...rest
    }: TimeSelectProps,
    ref,
  ) => {
    // Ensure step is between 1 and 60, and calculate total slots in a day
    const step = Math.max(1, Math.min(60, minutesStep))
    const totalSlots = (24 * 60) / step

    // Generate all time slots in a day
    const options = Array.from({ length: totalSlots })
      .flatMap((_, i) => {
        const minutesOfDay = i * step
        const optionTime = set(new Date(), {
          hours: Math.floor(minutesOfDay / 60),
          minutes: minutesOfDay % 60,
          seconds: 0,
          milliseconds: 0,
        })
        return {
          optionTime,
          value: format(optionTime, "HH:mm"),
          label: format(optionTime, "hh:mm a"),
        }
      })
      .filter(({ optionTime }) => {
        return earliestAllowableTime
          ? optionTime >= earliestAllowableTime
          : true
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
  },
)

/**
 * Parses a time string in the format "HH:mm" to a Date object set to today's date
 * @param time Time string in the format "HH:mm"
 * @returns
 */
export const parseTimeStringToDate = (time: string): Date => {
  return parse(time, "HH:mm", new Date())
}
