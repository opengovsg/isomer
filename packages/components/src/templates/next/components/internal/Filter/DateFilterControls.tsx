"use client"

import type { AppliedFilter, FilterItem } from "../../../types/Filter"
import { Checkbox, CheckboxGroup } from "../Checkbox"
import { DateRangeFilterInput } from "./DateRangeFilterInput"

interface DateFilterControlsProps {
  items: FilterItem[]
  checkboxValue?: string[]
  /** Accessible name for the status checkbox group. Unused when `items` is empty. */
  statusGroupLabel?: string
  /** Desktop sidebar: apply bucket toggles immediately. Omit in the drawer; CheckboxGroup owns state. */
  onBucketToggle?: (itemId: string) => void
  onCheckboxValuesChange?: (values: string[]) => void
  dateRange: AppliedFilter["dateRange"]
  onDateRangeChange: (dateRange: AppliedFilter["dateRange"]) => void
  showStatusLabelsFilter: boolean
  showDateRangeFilter: boolean
}

export const DateFilterControls = ({
  items,
  checkboxValue = [],
  statusGroupLabel,
  onBucketToggle,
  onCheckboxValuesChange,
  dateRange,
  onDateRangeChange,
  showStatusLabelsFilter,
  showDateRangeFilter,
}: DateFilterControlsProps) => {
  const showStatusCheckboxes = showStatusLabelsFilter && items.length > 0

  if (!showStatusCheckboxes && !showDateRangeFilter) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {showStatusCheckboxes && (
        <CheckboxGroup
          aria-label={statusGroupLabel}
          className="gap-2"
          value={checkboxValue}
          onChange={onCheckboxValuesChange}
        >
          {items.map(({ id: itemId, label: itemLabel, count }) => (
            <Checkbox
              key={itemId}
              className="w-fit cursor-pointer p-2"
              value={itemId}
              {...(onBucketToggle
                ? { onChange: () => onBucketToggle(itemId) }
                : {})}
            >
              {itemLabel} ({count.toLocaleString()})
            </Checkbox>
          ))}
        </CheckboxGroup>
      )}
      {showDateRangeFilter && (
        <DateRangeFilterInput value={dateRange} onChange={onDateRangeChange} />
      )}
    </div>
  )
}
