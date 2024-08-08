"use client"

import { useState } from "react"

import type {
  AppliedFilter,
  AppliedFiltersWithLabel,
  Filter as FilterType,
} from "../../types/Filter"
import type { CollectionPageSchemaType } from "~/engine"
import type { CollectionCardProps } from "~/interfaces"
import type {
  SortDirection,
  SortKey,
} from "~/interfaces/internal/CollectionSort"
import {
  CollectionCard,
  CollectionSearch,
  CollectionSort,
  Filter,
  Pagination,
  Pill,
} from "../../components/internal"

interface CollectionClientProps {
  page: CollectionPageSchemaType["page"]
  LinkComponent: CollectionPageSchemaType["LinkComponent"]
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
    const itemIndex = appliedFilters[filterIndex]?.items.findIndex(
      (item) => item.id === itemId,
    )
    if (itemIndex && itemIndex > -1) {
      const newAppliedFilters = [...appliedFilters]
      newAppliedFilters[filterIndex]?.items.splice(itemIndex, 1)

      if (newAppliedFilters[filterIndex]?.items.length === 0) {
        newAppliedFilters.splice(filterIndex, 1)
      }

      setAppliedFilters(newAppliedFilters)
    } else {
      const newAppliedFilters = [...appliedFilters]
      newAppliedFilters[filterIndex]?.items.push({ id: itemId })
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
    <div>
      <div className="bg-brand-canvas px-6">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-6 pb-12 pt-6 md:px-10">
          <div className="flex max-w-[54rem] flex-col gap-5 md:mt-6">
            <h1 className="prose-display-lg text-base-content-strong">
              {title}
            </h1>
            <p className="prose-title-lg-regular text-base-content">
              {subtitle}
            </p>
            <div className="mx-auto mt-5 w-full">
              <CollectionSearch
                placeholder={`Search for ${page.title.toLowerCase()}`}
                search={searchValue}
                setSearch={setSearchValue}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-screen-xl flex-col justify-center gap-10 px-10 pb-20 pt-16 lg:flex-row">
        <div className="w-full lg:w-1/4">
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
        <div className="flex w-full flex-col gap-4 lg:w-3/4">
          <div className="flex w-full flex-wrap items-end justify-between gap-6 sm:flex-nowrap">
            <div className="flex h-full w-full flex-col gap-3">
              <p className="mt-auto text-base text-content">
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
              {/* Commenting out applied filter display temporarily
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
              )}*/}
            </div>
            <div className="w-full shrink-0 sm:w-[260px]">
              <CollectionSort
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
              />
            </div>
          </div>
          <div className="flex h-full w-full flex-col gap-0">
            {paginatedItems.length > 0 &&
              paginatedItems.map((item) => (
                <CollectionCard
                  key={Math.random()}
                  {...item}
                  LinkComponent={LinkComponent}
                />
              ))}

            {paginatedItems.length === 0 && searchValue !== "" && (
              <div className="my-20 flex flex-col gap-3 text-center lg:m-auto">
                <p className="text-paragraph-01">
                  We couldn’t find articles that match your search.
                </p>
                <button
                  className="text-md mx-auto w-fit font-semibold text-hyperlink hover:text-hyperlink-hover lg:text-lg"
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
              <div className="m-auto flex flex-col gap-3 text-center">
                <p className="text-paragraph-01">
                  There are no items in this collection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {paginatedItems.length > 0 && (
        <div className="w-full">
          <div className="sm:ml-auto sm:max-w-96">
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
