"use client"

import { useState } from "react"
import type { CollectionPageSchema } from "~/engine"
import type { CollectionCardProps } from "~/interfaces"
import { SortDirection, SortKey } from "~/interfaces/internal/CollectionSort"
import {
  CollectionCard,
  CollectionSearch,
  CollectionSort,
  Filter,
  Pagination,
  Pill,
} from "../../components/internal"
import type {
  AppliedFilter,
  AppliedFiltersWithLabel,
  Filter as FilterType,
} from "../../types/Filter"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"

interface CollectionClientProps {
  page: CollectionPageSchema["page"]
  LinkComponent: CollectionPageSchema["LinkComponent"]
  items: CollectionCardProps[]
}

const getAvailableFilters = (items: CollectionCardProps[]): FilterType[] => {
  const categories: Record<string, number> = {}
  const variants: Record<string, number> = {}
  const years: Record<string, number> = {}

  items.forEach(({ category, variant, lastUpdated }) => {
    // Step 1: Get all available categories
    if (category in categories) {
      categories[category] += 1
    } else {
      categories[category] = 1
    }

    // Step 2: Get all available variants
    if (variant in variants) {
      variants[variant] += 1
    } else {
      variants[variant] = 1
    }

    // Step 3: Get all available years
    const year = new Date(lastUpdated).getFullYear().toString()
    if (year in years) {
      years[year] += 1
    } else {
      years[year] = 1
    }
  })

  const availableFilters: FilterType[] = [
    {
      id: "category",
      label: "Category",
      items: Object.entries(categories).map(([label, count]) => ({
        id: label.toLowerCase(),
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count,
      })),
    },
    {
      id: "variant",
      label: "Type",
      items: Object.entries(variants).map(([label, count]) => ({
        id: label.toLowerCase(),
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count,
      })),
    },
    {
      id: "year",
      label: "Year",
      items: Object.entries(years).map(([label, count]) => ({
        id: label.toLowerCase(),
        label,
        count,
      })),
    },
  ]

  return availableFilters
}

const getAppliedFiltersWithLabels = (
  filters: FilterType[],
  appliedFilters: AppliedFilter[],
): AppliedFiltersWithLabel[] => {
  return appliedFilters.flatMap((appliedFilterType) =>
    appliedFilterType.items.map((appliedFilter) => {
      const label =
        filters
          .find((filterType) => filterType.id === appliedFilterType.id)
          ?.items.find((filter) => filter.id === appliedFilter.id)?.label ||
        appliedFilter.id

      return {
        appliedFilterTypeId: appliedFilterType.id,
        appliedFilterId: appliedFilter.id,
        label,
      }
    }),
  )
}

const getFilteredItems = (
  items: CollectionCardProps[],
  appliedFilters: AppliedFilter[],
  searchValue: string,
): CollectionCardProps[] => {
  return items.filter((item) => {
    // Step 1: Filter based on search value
    if (
      searchValue !== "" &&
      !item.title.toLowerCase().includes(searchValue.toLowerCase()) &&
      !item.description.toLowerCase().includes(searchValue.toLowerCase())
    ) {
      return false
    }

    // Step 2: Remove items that do not match the applied category filters
    const categoryFilter = appliedFilters.find(
      (filter) => filter.id === "category",
    )
    if (
      categoryFilter &&
      !categoryFilter.items.some(
        (filterItem) => filterItem.id === item.category.toLowerCase(),
      )
    ) {
      return false
    }

    // Step 3: Remove items that do not match the applied variant filters
    const variantFilter = appliedFilters.find(
      (filter) => filter.id === "variant",
    )
    if (
      variantFilter &&
      !variantFilter.items.some(
        (filterItem) => filterItem.id === item.variant.toLowerCase(),
      )
    ) {
      return false
    }

    // Step 4: Remove items that do not match the applied year filters
    const yearFilter = appliedFilters.find((filter) => filter.id === "year")
    if (
      yearFilter &&
      !yearFilter.items.some(
        (filterItem) =>
          new Date(item.lastUpdated).getFullYear().toString() === filterItem.id,
      )
    ) {
      return false
    }

    return true
  })
}

const getSortedItems = (
  items: CollectionCardProps[],
  sortBy: SortKey,
  sortDirection: SortDirection,
) => {
  return [...items].sort((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.lastUpdated)
      const dateB = new Date(b.lastUpdated)
      return sortDirection === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime()
    }
    return 0
  })
}

const getPaginatedItems = (
  items: CollectionCardProps[],
  itemsPerPage: number,
  currPage: number,
) => {
  const normalizedCurrPage = Math.max(1, currPage)

  return items.slice(
    (normalizedCurrPage - 1) * itemsPerPage,
    normalizedCurrPage * itemsPerPage,
  )
}

const updateAppliedFilters = (
  appliedFilters: AppliedFilter[],
  setAppliedFilters: (appliedFilters: AppliedFilter[]) => void,
  filterId: string,
  itemId: string,
) => {
  const filterIndex = appliedFilters.findIndex(
    (filter) => filter.id === filterId,
  )
  if (filterIndex > -1) {
    const itemIndex = appliedFilters[filterIndex].items.findIndex(
      (item) => item.id === itemId,
    )
    if (itemIndex > -1) {
      const newAppliedFilters = [...appliedFilters]
      newAppliedFilters[filterIndex].items.splice(itemIndex, 1)

      if (newAppliedFilters[filterIndex].items.length === 0) {
        newAppliedFilters.splice(filterIndex, 1)
      }

      setAppliedFilters(newAppliedFilters)
    } else {
      const newAppliedFilters = [...appliedFilters]
      newAppliedFilters[filterIndex].items.push({ id: itemId })
      setAppliedFilters(newAppliedFilters)
    }
  } else {
    setAppliedFilters([
      ...appliedFilters,
      { id: filterId, items: [{ id: itemId }] },
    ])
  }
}

const CollectionClient = ({
  page,
  LinkComponent,
  items,
}: CollectionClientProps) => {
  const ITEMS_PER_PAGE = 6
  const { defaultSortBy, defaultSortDirection, subtitle, title } = page

  const [sortBy, setSortBy] = useState<SortKey>(defaultSortBy)
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  const [searchValue, setSearchValue] = useState<string>("")
  const [currPage, setCurrPage] = useState<number>(1)

  const filters = getAvailableFilters(items)

  // Step 1: Filter items based on applied filters and search value
  const filteredItems = getFilteredItems(items, appliedFilters, searchValue)

  // Step 2: Sort items based on sort key and sort direction
  const sortedItems = getSortedItems(filteredItems, sortBy, sortDirection)

  // Step 3: Paginate the sorted items
  const paginatedItems = getPaginatedItems(
    sortedItems,
    ITEMS_PER_PAGE,
    currPage,
  )

  return (
    <div className="max-w-container flex flex-col gap-16 mx-auto my-20 px-6 md:px-10 py-16 items-center">
      <div className="flex flex-col gap-12 w-full">
        <h1
          className={`flex flex-col gap-16 text-content-strong ${Heading[1]}`}
        >
          {title}
        </h1>
        <p className={`${Paragraph[1]} text-content`}>{subtitle}</p>
      </div>

      <div className="w-full sm:w-3/4 mx-auto">
        <CollectionSearch
          placeholder={`Search for ${page.title.toLowerCase()}`}
          search={searchValue}
          setSearch={setSearchValue}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-10 justify-between w-full">
        <div className="w-full lg:w-1/5 xl:w-1/6">
          <Filter
            filters={filters}
            appliedFilters={appliedFilters}
            setAppliedFilters={(id: string, itemId: string) =>
              updateAppliedFilters(
                appliedFilters,
                setAppliedFilters,
                id,
                itemId,
              )
            }
          />
        </div>
        <div className="flex flex-col gap-6 w-full lg:w-4/5 xl:w-5/6">
          <div className="flex flex-wrap sm:flex-nowrap justify-between w-full items-start gap-6">
            <div className="flex flex-col gap-3 w-full h-full">
              <p className={`${Paragraph[1]} text-content mt-auto`}>
                {appliedFilters.length > 0 || searchValue !== ""
                  ? `${filteredItems.length} search ${
                      filteredItems.length === 1 ? "result" : "results"
                    }`
                  : `${items.length} ${
                      items.length === 1 ? "article" : "articles"
                    }`}
                {searchValue !== "" && (
                  <>
                    {" "}
                    for "<b>{searchValue}</b>"
                  </>
                )}
              </p>

              {appliedFilters.length > 0 && (
                <div className="flex flex-row flex-wrap gap-3">
                  {getAppliedFiltersWithLabels(filters, appliedFilters).map(
                    (appliedFilter) => (
                      <Pill
                        key={`${appliedFilter.appliedFilterTypeId}-${appliedFilter.appliedFilterId}`}
                        content={appliedFilter.label}
                        onClose={() =>
                          updateAppliedFilters(
                            appliedFilters,
                            setAppliedFilters,
                            appliedFilter.appliedFilterTypeId,
                            appliedFilter.appliedFilterId,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </div>
            <div className="w-full sm:w-[260px] shrink-0">
              <CollectionSort
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
              />
            </div>
          </div>
          <div className="flex flex-col gap-0 h-full w-full">
            {paginatedItems.length > 0 &&
              paginatedItems.map((item) => (
                <CollectionCard
                  key={Math.random()}
                  {...item}
                  LinkComponent={LinkComponent}
                />
              ))}

            {paginatedItems.length === 0 && searchValue !== "" && (
              <div className="m-auto text-center flex flex-col gap-3">
                <p className={`${Paragraph["1"]}`}>
                  We couldn’t find articles that match your search.
                </p>
                <button
                  className="w-fit mx-auto text-hyperlink hover:text-hyperlink-hover text-lg font-semibold"
                  onClick={() => {
                    setSearchValue("")
                    setAppliedFilters([])
                  }}
                >
                  Clear all filters
                </button>
              </div>
            )}

            {items.length === 0 && (
              <div className="m-auto text-center flex flex-col gap-3">
                <p className={`${Paragraph["1"]}`}>
                  There are no items in this collection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {paginatedItems.length > 0 && (
        <div className="w-full">
          <div className="sm:max-w-96 sm:ml-auto">
            <Pagination
              totalItems={filteredItems.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currPage={currPage}
              setCurrPage={setCurrPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default CollectionClient
