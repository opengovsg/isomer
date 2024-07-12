"use client"

import { useState } from "react"
import { BiChevronDown } from "react-icons/bi"

import type { FilterProps } from "../../../types/Filter"

const Filter = ({
  filters,
  appliedFilters,
  setAppliedFilters,
}: FilterProps) => {
  const [showFilter, setShowFilter] = useState<Record<string, boolean>>(
    filters.reduce((acc, { id }) => ({ ...acc, [id]: true }), {}),
  )

  const updateFilterToggle = (filterId: string) => {
    setShowFilter({ ...showFilter, [filterId]: !showFilter[filterId] })
  }

  return (
    <div className="flex flex-col divide-y divide-divider-medium last:border-b last:border-b-divider-medium">
      <p className="pb-3 text-lg text-gray-800 font-semibold">Filters</p>
      {filters.map(({ id, label, items }) => (
        <div className="py-4" key={id}>
          <button
            className="flex w-full flex-row"
            onClick={() => updateFilterToggle(id)}
          >
            <h5 className="text-base text-gray-700 font-semibold">{label}</h5>
            <div className="flex-1"></div>
            <BiChevronDown
              className={`text-2xl text-content-medium transition-all duration-300 ease-in-out ${
                showFilter[id] ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          <div
            className={`flex w-full flex-col pt-4 text-content-medium ${
              showFilter[id] ? "block" : "hidden"
            }`}
          >
            {items.map(({ id: itemId, label: itemLabel, count }) => (
              <label
                key={itemId}
                htmlFor={itemId}
                className="flex w-full flex-row rounded px-2 py-2 align-middle hover:bg-interaction-main-subtle-hover "
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-2 my-1 border-gray-300 text-interaction-main "
                  id={itemId}
                  name={itemId}
                  checked={
                    !!appliedFilters
                      .find((filter) => filter.id === id)
                      ?.items.some((item) => item.id === itemId)
                  }
                  onChange={() => setAppliedFilters(id, itemId)}
                />
                <p className="ml-3 inline-block break-words text-base text-gray-700">
                  {itemLabel} ({count.toLocaleString()})
                </p>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Filter
