import type {
  FormatOptionLabelMeta,
  PlaceholderProps,
  SelectInstance,
} from "chakra-react-select"
import { Divider, Flex, Icon, Text } from "@chakra-ui/react"
import { components } from "chakra-react-select"
import { format, parse, set } from "date-fns"
import React from "react"
import { BiTimeFive } from "react-icons/bi"
import { getTimezoneAbbreviation } from "~/lib/dates"

import type { BaseSelectOption, BaseSelectProps } from "./BaseSelect"
import { BaseSelect } from "./BaseSelect"

interface TimeSelectProps extends Omit<BaseSelectProps<string>, "options"> {
  size: "sm" | "md" | "lg"
  earliestAllowableTime?: Date | null
  // the earliest time that can be selected, if any
  minutesStep?: 5 | 10 | 15 | 20 | 30 | 60
  // determines granularity of time options
}

const TimeSelectTimezoneBadge = (): React.ReactNode => (
  <Text textStyle="caption-2" color="base.content.medium">
    {getTimezoneAbbreviation()}
  </Text>
)

const TimeSelectDropdownIndicator = (): React.ReactNode => (
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

const TimeSelectIndicatorSeparator = (): React.ReactNode => (
  <Divider h="100%" orientation="vertical" borderColor="base.divider.strong" />
)

const TimeSelectPlaceholder = (
  props: PlaceholderProps<BaseSelectOption<string>>,
): React.ReactNode => (
  <components.Placeholder {...props}>
    <Flex align="center" justify="space-between" w="100%">
      <Text>Select time</Text>
      <TimeSelectTimezoneBadge />
    </Flex>
  </components.Placeholder>
)

const formatTimeSelectOptionLabel = (
  option: BaseSelectOption<string>,
  { context }: FormatOptionLabelMeta<BaseSelectOption<string>>,
): React.ReactNode => (
  <Flex
    align="center"
    justify="space-between"
    w="100%"
    cursor="pointer"
    flexDir="row"
  >
    <Text>{option.label}</Text>
    {context === "value" && <TimeSelectTimezoneBadge />}
  </Flex>
)

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
    const totalSlots = (24 * 60) / minutesStep

    // Generate all time slots in a day
    const options = (() => {
      const slots: {
        optionTime: Date
        value: string
        label: string
      }[] = []
      for (let i = 0; i < totalSlots; i++) {
        const minutesOfDay = i * minutesStep
        const optionTime = set(new Date(), {
          hours: Math.floor(minutesOfDay / 60),
          milliseconds: 0,
          minutes: minutesOfDay % 60,
          seconds: 0,
        })
        if (earliestAllowableTime && optionTime < earliestAllowableTime) {
          continue
        }
        slots.push({
          label: format(optionTime, "hh:mm a"),
          optionTime,
          value: format(optionTime, "HH:mm"),
        })
      }
      return slots
    })()

    return (
      <BaseSelect
        ref={ref}
        value={value}
        options={options}
        placeholder="Select time"
        formatOptionLabel={formatTimeSelectOptionLabel}
        customComponents={{
          DropdownIndicator: TimeSelectDropdownIndicator,
          IndicatorSeparator: TimeSelectIndicatorSeparator,
          Placeholder: TimeSelectPlaceholder,
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
export const parseTimeStringToDate = (time: string): Date =>
  parse(time, "HH:mm", new Date())
