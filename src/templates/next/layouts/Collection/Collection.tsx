import { useState } from "react"
import { CollectionCardProps } from "~/common"
import { SortDirection, SortKey } from "~/common/CollectionSort"
import type { CollectionPageSchema } from "~/engine"
import { CollectionCard } from "../../components"
import CollectionSort from "../../components/shared/CollectionSort"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"
import { Skeleton } from "../Skeleton"
import type { Filter as FilterType, AppliedFilter } from "../../types/Filter"
import { CollectionSearch, Filter, Pagination } from "../../components/shared"

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

const getOutput = (
  items: CollectionCardProps[],
  appliedFilters: AppliedFilter[],
  searchValue: string,
  itemsPerPage: number,
  currPage: number,
  sortBy: SortKey,
  sortDirection: SortDirection,
) => {
  // Step 1: Filter items based on applied filters and search value
  const filteredItems = getFilteredItems(items, appliedFilters, searchValue)

  // Step 2: Sort items based on sort key and sort direction
  const sortedItems = getSortedItems(filteredItems, sortBy, sortDirection)

  // Step 3: Paginate the sorted items
  const paginatedItems = getPaginatedItems(sortedItems, itemsPerPage, currPage)

  return paginatedItems
}

const CollectionLayout = ({
  site,
  page,
  LinkComponent,
}: CollectionPageSchema) => {
  const ITEMS_PER_PAGE = 6
  const { defaultSortBy, defaultSortDirection, items, subtitle, title } = page

  const [sortBy, setSortBy] = useState<SortKey>(defaultSortBy)
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  const [searchValue, setSearchValue] = useState<string>("")
  const [currPage, setCurrPage] = useState<number>(1)

  const filters = getAvailableFilters(items)
  const output = getOutput(
    items,
    appliedFilters,
    searchValue,
    ITEMS_PER_PAGE,
    currPage,
    sortBy,
    sortDirection,
  )

  return (
    <Skeleton site={site} page={page}>
      <div className="max-w-[1140px] flex flex-col gap-16 mx-auto my-20 items-center">
        <div className="flex flex-col gap-12">
          <h1
            className={`flex flex-col gap-16 text-content-strong ${Heading[1]}`}
          >
            {title}
          </h1>
          <p className={`${Paragraph[1]} text-content`}>{subtitle}</p>
        </div>
        <div className="w-3/4 mx-auto">
          <CollectionSearch
            placeholder={`Search for ${page.title.toLowerCase()}`}
            search={searchValue}
            setSearch={setSearchValue}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-10 justify-between w-full">
          <div className="w-full sm:w-1/6">
            <Filter
              filters={filters}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
            />
          </div>
          <div className="flex flex-col gap-6 w-full sm:w-5/6">
            <div className="flex justify-between w-full items-end">
              <p className={`${Paragraph[1]} text-content`}>
                {appliedFilters.length > 0 || searchValue !== ""
                  ? `${output.length} search ${
                      output.length === 1 ? "result" : "results"
                    }`
                  : `${items.length} ${
                      items.length === 1 ? "article" : "articles"
                    }`}
              </p>
              <div className="w-[260px]">
                <CollectionSort
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortDirection={sortDirection}
                  setSortDirection={setSortDirection}
                />
              </div>
            </div>
            <div className="flex flex-col gap-0">
              {output.map((item) => (
                <CollectionCard {...item} LinkComponent={LinkComponent} />
              ))}
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="sm:max-w-96 sm:ml-auto">
            <Pagination
              totalItems={items.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currPage={currPage}
              setCurrPage={setCurrPage}
            />
          </div>
        </div>
      </div>
    </Skeleton>
  )
}

export default CollectionLayout
