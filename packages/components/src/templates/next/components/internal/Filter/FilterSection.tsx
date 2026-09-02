"use client"

import { useButton } from "@react-aria/button"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"
import { useRef } from "react"
import { BiChevronDown } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing, groupFocusVisibleHighlight } from "~/utils/tailwind"

import type { AppliedFilter, Filter } from "../../../types/Filter"
import { Checkbox, CheckboxGroup } from "../Checkbox"
import { DateRangeFilterInput } from "./DateRangeFilterInput"

const sidebarHeaderStyle = tv({
  extend: groupFocusVisibleHighlight,
})

const drawerHeaderStyle = tv({
  extend: focusRing,
  base: "prose-headline-base-semibold flex w-full flex-row items-center justify-between gap-4 text-left text-base-content",
})

interface FilterSectionHeaderProps {
  label: string
  isExpanded: boolean
  onToggle: () => void
  variant: "sidebar" | "drawer"
}

const FilterSectionHeader = ({
  label,
  isExpanded,
  onToggle,
  variant,
}: FilterSectionHeaderProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { buttonProps } = useButton({ onPress: onToggle }, buttonRef)
  const { focusProps, isFocusVisible } = useFocusRing()
  const mergedProps = mergeProps(buttonProps, focusProps)

  if (variant === "sidebar") {
    return (
      <button
        {...mergedProps}
        ref={buttonRef}
        className="group prose-headline-base-semibold flex w-full flex-row items-center justify-between gap-4 text-left text-base-content outline-0"
      >
        <label className={sidebarHeaderStyle()}>{label}</label>
        <BiChevronDown
          aria-hidden
          className={`h-6 w-6 flex-shrink-0 text-base-content-strong transition-all duration-300 ease-in-out ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
    )
  }

  return (
    <button
      {...mergedProps}
      ref={buttonRef}
      className={twMerge(
        drawerHeaderStyle({
          isFocusVisible,
        }),
      )}
    >
      <span>{label}</span>
      <BiChevronDown
        aria-hidden
        className={`mr-3 h-6 w-6 flex-shrink-0 text-base-content-strong transition-all duration-300 ease-in-out ${
          isExpanded ? "rotate-180" : "rotate-0"
        }`}
      />
    </button>
  )
}

type FilterSectionBaseProps = {
  filter: Filter
  isExpanded: boolean
  onToggleExpanded: () => void
  selectedItemIds: string[]
  dateRange?: AppliedFilter["dateRange"]
  onDateRangeChange: (dateRange: AppliedFilter["dateRange"]) => void
  className?: string
  headerVariant: "sidebar" | "drawer"
  dateRangePresentation?: "popover" | "modal"
}

type FilterSectionProps =
  | (FilterSectionBaseProps & {
      commitMode: "immediate"
      onItemToggle: (itemId: string) => void
    })
  | (FilterSectionBaseProps & {
      commitMode: "staged"
      onSelectionChange: (itemIds: string[]) => void
    })

export const FilterSection = (props: FilterSectionProps) => {
  const {
    filter: { label, items, type, dateRangeFilterLabel },
    isExpanded,
    onToggleExpanded,
    selectedItemIds,
    dateRange,
    onDateRangeChange,
    className,
    headerVariant,
    dateRangePresentation = "popover",
    commitMode,
  } = props

  return (
    <CheckboxGroup
      className={className}
      value={selectedItemIds}
      onChange={commitMode === "staged" ? props.onSelectionChange : undefined}
    >
      <FilterSectionHeader
        label={label}
        isExpanded={isExpanded}
        onToggle={onToggleExpanded}
        variant={headerVariant}
      />

      <div className={isExpanded ? "flex flex-col gap-2" : "hidden"}>
        {items.map(({ id: itemId, label: itemLabel, count }) => (
          <Checkbox
            key={itemId}
            className="w-fit cursor-pointer p-2"
            value={itemId}
            onChange={
              commitMode === "immediate"
                ? () => props.onItemToggle(itemId)
                : undefined
            }
          >
            {itemLabel} ({count.toLocaleString()})
          </Checkbox>
        ))}
        {type === "date" && (
          <DateRangeFilterInput
            presentation={dateRangePresentation}
            value={dateRange}
            onChange={onDateRangeChange}
            label={dateRangeFilterLabel}
          />
        )}
      </div>
    </CheckboxGroup>
  )
}
