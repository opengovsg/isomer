"use client"

import { useState } from "react"
import { BiCheck, BiChevronDown } from "react-icons/bi"

import { SortDirection, SortKey } from "~/interfaces/internal/CollectionSort"
import CollectionSortProps from "~/templates/next/types/CollectionSort"

interface SortConfig {
  sortBy: SortKey
  sortDirection: SortDirection
}

const SortOptions = ["Most recent", "Least recent"] as const

type SortOption = (typeof SortOptions)[number]

const SortOptionToConfigMap: Record<SortOption, SortConfig> = {
  "Most recent": {
    sortBy: "date",
    sortDirection: "desc",
  },
  "Least recent": {
    sortBy: "date",
    sortDirection: "asc",
  },
}

const SortConfigToOptionMap: Record<
  SortKey,
  Record<SortDirection, SortOption>
> = {
  date: {
    desc: "Most recent",
    asc: "Least recent",
  },
}

const CollectionSort = ({
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
}: CollectionSortProps) => {
  const [showSortOptions, setShowSortOptions] = useState(false)
  const selectedSortOption = SortConfigToOptionMap[sortBy][sortDirection]

  return (
    <div className="relative">
      <div className="flex flex-col gap-2">
        <button
          className={`flex justify-between gap-6 rounded-[4px] border px-4 py-2.5 ${
            showSortOptions
              ? "border-focus-outline outline outline-1 outline-focus-outline"
              : "border-divider-medium"
          }`}
          aria-label={
            showSortOptions ? "Hide sort options" : "Show sort options"
          }
          onClick={() => setShowSortOptions(!showSortOptions)}
        >
          {selectedSortOption}
          <BiChevronDown
            className={`my-auto h-auto w-5 flex-shrink-0 transition-all duration-300 ease-in-out ${
              showSortOptions ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>

      {showSortOptions && (
        <div className="absolute my-3 flex w-full flex-col gap-0 rounded-[4px] bg-white shadow-sm">
          {SortOptions.map((option) => (
            <button
              key={option}
              className={`flex w-full items-center justify-between rounded-[4px] px-4 py-2.5 text-left hover:bg-interaction-main-subtle-hover ${
                option === selectedSortOption && "border-2 border-focus-outline"
              }`}
              onClick={() => {
                setSortBy(SortOptionToConfigMap[option].sortBy)
                setSortDirection(SortOptionToConfigMap[option].sortDirection)
                setShowSortOptions(false)
              }}
            >
              {option}
              {option === selectedSortOption && (
                <BiCheck className="h-auto w-5 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CollectionSort
