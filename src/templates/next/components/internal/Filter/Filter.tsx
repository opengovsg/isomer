"use client"

import { useState } from "react"
import { BiChevronDown } from "react-icons/bi"
import type { FilterProps } from "../../../types/Filter"
import { Heading } from "../../../typography/Heading"
import { Paragraph } from "../../../typography/Paragraph"

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
      <h5 className={`${Heading[5]} text-content py-4`}>Filter by</h5>
      {filters.map(({ id, label, items }) => (
        <div className="py-4" key={id}>
          <button
            className="flex flex-row w-full"
            onClick={() => updateFilterToggle(id)}
          >
            <h5 className={`${Paragraph["1"]} font-medium text-content-medium`}>
              {label}
            </h5>
            <div className="flex-1"></div>
            <BiChevronDown
              className={`text-2xl text-content-medium transition-all duration-300 ease-in-out ${
                showFilter[id] ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          <div
            className={`flex flex-col w-full pt-4 gap-3 text-content-medium ${
              showFilter[id] ? "block" : "hidden"
            }`}
          >
            {items.map(({ id: itemId, label: itemLabel, count }) => (
              <label
                key={itemId}
                htmlFor={itemId}
                className="flex flex-row align-middle w-full px-1 py-2 rounded hover:bg-interaction-main-subtle-hover has-[:focus]:ring-2 has-[:focus]:ring-focus-outline"
              >
                <input
                  type="checkbox"
                  className="h-6 w-6 rounded border-2 border-divider-medium text-interaction-main group-focus:ring-2 group-focus:ring-focus-outline focus:ring-0"
                  id={itemId}
                  name={itemId}
                  checked={
                    !!appliedFilters
                      .find((filter) => filter.id === id)
                      ?.items.some((item) => item.id === itemId)
                  }
                  onChange={() => setAppliedFilters(id, itemId)}
                />
                <p
                  className={`${Paragraph["2"]} ml-4 inline-block break-words`}
                >
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
