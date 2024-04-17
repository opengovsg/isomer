"use client"

import { useState } from "react"
import { BiCheck } from "react-icons/bi"
import { MdKeyboardArrowDown } from "react-icons/md"
import { SortDirection, SortKey } from "~/common/CollectionSort"
import CollectionSortProps from "~/templates/next/types/CollectionSort"
import { Paragraph } from "../../../typography/Paragraph"

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
        <p className={`${Paragraph[2]} text-content-strong`}>Sort by</p>
        <button
          className={`flex gap-6 justify-between border border-divider-medium py-2.5 px-4 rounded-[4px] ${
            showSortOptions && "border-2 border-focus-outline"
          }`}
          aria-label={
            showSortOptions ? "Hide sort options" : "Show sort options"
          }
          onClick={() => setShowSortOptions(!showSortOptions)}
        >
          {selectedSortOption}
          <MdKeyboardArrowDown
            className={`w-5 h-auto flex-shrink-0 transition-all duration-300 ease-in-out ${
              showSortOptions ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>
      {showSortOptions && (
        <div className="absolute w-full bg-white flex flex-col gap-0 rounded-[4px] py-3">
          {SortOptions.map((option) => (
            <button
              key={option}
              className={`flex justify-between items-center w-full rounded-[4px] py-2.5 px-4 text-left hover:bg-interaction-main-subtle-hover ${
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
                <BiCheck className="w-5 h-auto flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CollectionSort
