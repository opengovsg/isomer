"use client"

import type { CollectionPageSchemaType } from "~/engine"
import type { CollectionCardProps } from "~/interfaces"
import {
  CollectionCard,
  CollectionSearch,
  CollectionSort,
  Filter,
  Pagination,
} from "../../components/internal"
import { ITEMS_PER_PAGE, useCollection } from "./useCollection"

interface CollectionClientProps {
  page: CollectionPageSchemaType["page"]
  LinkComponent: CollectionPageSchemaType["LinkComponent"]
  items: CollectionCardProps[]
}

const CollectionClient = ({
  page,
  LinkComponent,
  items,
}: CollectionClientProps) => {
  const { title, subtitle } = page
  const {
    filters,
    paginatedItems,
    filteredCount,
    searchValue,
    appliedFilters,
    handleAppliedFiltersChange,
    handleSearchValueChange,
    handleClearFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    currPage,
    setCurrPage,
  } = useCollection({ page, items })

  return (
    <div className="mx-auto my-16 flex max-w-screen-xl flex-col items-start gap-16 px-6 md:px-10">
      <div className="flex max-w-[47.8rem] flex-col gap-12">
        <h1 className="flex flex-col gap-16 text-content-strong text-heading-01">
          {title}
        </h1>
        <p className="text-content text-paragraph-01">{subtitle}</p>
      </div>

      <div className="mx-auto w-full">
        <CollectionSearch
          placeholder={`Search for ${page.title.toLowerCase()}`}
          search={searchValue}
          setSearch={handleSearchValueChange}
        />
      </div>

      <div className="flex w-full flex-col justify-between gap-10 lg:flex-row">
        <div className="w-full lg:w-1/4">
          <Filter
            filters={filters}
            appliedFilters={appliedFilters}
            setAppliedFilters={handleAppliedFiltersChange}
          />
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-3/4">
          <div className="flex w-full flex-wrap items-end justify-between gap-6 sm:flex-nowrap">
            <div className="flex h-full w-full flex-col gap-3">
              <p className="mt-auto text-base text-content">
                {appliedFilters.length > 0 || searchValue !== ""
                  ? `${filteredCount} search result${
                      filteredCount === 1 ? "" : "s"
                    }`
                  : `${items.length} article${items.length === 1 ? "" : "s"}`}
                {searchValue !== "" && (
                  <>
                    {" "}
                    for "<b>{searchValue}</b>"
                  </>
                )}
              </p>
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
                  onClick={handleClearFilter}
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
              totalItems={filteredCount}
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
