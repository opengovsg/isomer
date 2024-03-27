import { CollectionSortProps } from "~/common"
import { Paragraph } from "../../typography/Paragraph"
import { useState } from "react"
import { MdKeyboardArrowDown } from "react-icons/md"
import { SortDirection, SortKey } from "~/common/CollectionSort"

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
          className="flex gap-6 justify-between border border-divider-medium py-2.5 px-4"
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
        <div className="absolute w-full bg-white">
          {SortOptions.filter((option) => option !== selectedSortOption).map(
            (option) => (
              <button
                key={option}
                className="w-full border border-t-0 border-divider-medium py-2.5 px-4 text-left hover:bg-hyperlink-hover-inverse"
                onClick={() => {
                  setSortBy(SortOptionToConfigMap[option].sortBy)
                  setSortDirection(SortOptionToConfigMap[option].sortDirection)
                  setShowSortOptions(false)
                }}
              >
                {option}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export default CollectionSort
