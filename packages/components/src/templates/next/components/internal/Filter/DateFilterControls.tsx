"use client"

import type { AppliedFilter, FilterItem } from "../../../types/Filter"
import { Checkbox } from "../Checkbox"
import { DateRangeFilterInput } from "./DateRangeFilterInput"

interface DateFilterControlsProps {
  items: FilterItem[]
  /** Desktop sidebar: apply bucket toggles immediately. Omit in the drawer; CheckboxGroup owns state. */
  onBucketToggle?: (itemId: string) => void
  dateRange: AppliedFilter["dateRange"]
  onDateRangeChange: (dateRange: AppliedFilter["dateRange"]) => void
}

export const DateFilterControls = ({
  items,
  onBucketToggle,
  dateRange,
  onDateRangeChange,
}: DateFilterControlsProps) => {
  return (
    <div className="flex flex-col gap-2">
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
      <DateRangeFilterInput value={dateRange} onChange={onDateRangeChange} />
    </div>
  )
}
