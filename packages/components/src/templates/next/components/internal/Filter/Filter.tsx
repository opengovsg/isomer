"use client"

import { useState } from "react"
import { Label } from "react-aria-components"
import { BiChevronDown } from "react-icons/bi"

import type { FilterProps } from "../../../types/Filter"
import { Checkbox, CheckboxGroup } from "../Checkbox"

export const Filter = ({
  filters,
  appliedFilters,
  setAppliedFilters,
}: FilterProps) => {
  const [showFilter, setShowFilter] = useState<Record<string, boolean>>(
    filters.reduce((acc, { id }) => ({ ...acc, [id]: true }), {}),
  )

  const appliedItemsById = appliedFilters.reduce(
    (acc, { id, items }) => ({ ...acc, [id]: items.map(({ id }) => id) }),
    {} as Record<string, string[]>,
  )

  const updateFilterToggle = (filterId: string) => {
    setShowFilter((prevFilters) => ({
      ...prevFilters,
      [filterId]: !prevFilters[filterId],
    }))
  }

  return (
    <aside>
      <div className="flex flex-row justify-between gap-4 border-b border-b-base-divider-medium pb-3">
        <h2 className="prose-headline-lg-semibold text-base-content-strong">
          Filters
        </h2>
      </div>
      {filters.map(({ id, label, items }) => (
        <CheckboxGroup
          className="border-b border-b-divider-medium py-4"
          key={id}
          value={appliedItemsById[id] ?? []}
        >
          <button className="w-full" onClick={() => updateFilterToggle(id)}>
            <Label className="prose-headline-base-semibold flex w-full flex-row justify-between gap-4 text-base-content">
              {label}
              <BiChevronDown
                aria-hidden
                className={`text-2xl text-content-medium transition-all duration-300 ease-in-out ${
                  showFilter[id] ? "rotate-180" : "rotate-0"
                }`}
              />
            </Label>
          </button>

          <div className={showFilter[id] ? "flex flex-col" : "hidden"}>
            {items.map(({ id: itemId, label: itemLabel, count }) => (
              <Checkbox
                key={itemId}
                className="p-2"
                value={itemId}
                onChange={() => setAppliedFilters(id, itemId)}
              >
                {itemLabel} ({count.toLocaleString()})
              </Checkbox>
            ))}
          </div>
        </CheckboxGroup>
      ))}
    </aside>
  )
}
