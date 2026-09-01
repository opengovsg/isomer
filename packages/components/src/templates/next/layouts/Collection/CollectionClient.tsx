"use client"

import type {
  BreadcrumbProps,
  ProcessedCollectionCardProps,
} from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"
import { useMemo, useRef } from "react"
import { tv } from "~/lib/tv"

import { BackToTopLink } from "../../components/internal/BackToTopLink"
import { CollectionSearch } from "../../components/internal/CollectionSearch"
import { Filter } from "../../components/internal/Filter"
import { PaginationControls } from "../../components/internal/PaginationControls"
import { CollectionPageHeader } from "./CollectionPageHeader"
import { CollectionResults } from "./CollectionResults"
import { ITEMS_PER_PAGE, useCollection } from "./useCollection"
import { getAvailableFilters } from "./utils/getAvailableFilters"

interface CollectionClientProps {
  page: CollectionPagePageProps
  items: ProcessedCollectionCardProps[]
  shouldShowDate: boolean
  siteAssetsBaseUrl: string | undefined
  breadcrumb: BreadcrumbProps
}

const createCollectionLayoutStyles = tv({
  slots: {
    container:
      "relative mx-auto grid max-w-screen-xl grid-cols-12 px-6 pb-16 pt-8 md:px-10",
    filterContainer: "relative col-span-12 pb-2 pt-8 lg:col-span-3 lg:pb-10",
    content: "col-span-12 flex flex-col gap-8 pt-8 lg:col-span-9 lg:ml-24",
  },
  variants: {
    hasNoFilters: {
      true: {
        filterContainer: "hidden",
        content: "pt-0 lg:col-span-12 lg:ml-0",
      },
    },
  },
})

const compoundStyles = createCollectionLayoutStyles()

export const CollectionClient = ({
  page,
  items,
  shouldShowDate,
  siteAssetsBaseUrl,
  breadcrumb,
}: CollectionClientProps) => {
  const {
    paginatedItems,
    filteredCount,
    searchValue,
    appliedFilters,
    handleFilterToggle,
    handleDateRangeChange,
    setAppliedFilters,
    handleSearchValueChange,
    handleClearFilter,
    currPage,
    setCurrPage,
    totalCount,
  } = useCollection({ items })

  const articleContainerRef = useRef<HTMLDivElement>(null)
  const onPageChange = () => {
    articleContainerRef.current?.scrollIntoView({
      block: "start",
    })
  }

  const filters = useMemo(
    () => getAvailableFilters(items, page.tagCategories),
    [items, page.tagCategories],
  )
  const hasNoFilters = filters.length === 0

  return (
    <>
      <CollectionPageHeader
        title={page.title}
        subtitle={page.subtitle}
        breadcrumb={breadcrumb}
      >
        <CollectionSearch
          placeholder="Start typing to search"
          search={searchValue}
          setSearch={handleSearchValueChange}
        />
      </CollectionPageHeader>
      <div className={compoundStyles.container()}>
        <div
          className={compoundStyles.filterContainer({
            hasNoFilters,
          })}
        >
          <Filter
            filters={filters}
            appliedFilters={appliedFilters}
            handleFilterToggle={handleFilterToggle}
            handleDateRangeChange={handleDateRangeChange}
            setAppliedFilters={setAppliedFilters}
            handleClearFilter={handleClearFilter}
          />
        </div>
        <div
          className={compoundStyles.content({
            hasNoFilters,
          })}
          ref={articleContainerRef}
        >
          <div className="flex w-full flex-col gap-3">
            <CollectionResults
              variant={page.variant}
              appliedFilters={appliedFilters}
              filteredCount={filteredCount}
              handleClearFilter={handleClearFilter}
              paginatedItems={paginatedItems}
              searchValue={searchValue}
              totalCount={totalCount}
              shouldShowDate={shouldShowDate}
              siteAssetsBaseUrl={siteAssetsBaseUrl}
              tagCategories={page.tagCategories}
              headingLevel={2}
            />
          </div>
          <div className="flex w-full flex-col-reverse items-center justify-between gap-4 lg:flex-row">
            <BackToTopLink className="hidden lg:inline-flex" />
            {paginatedItems.length > 0 && (
              <PaginationControls
                totalItems={filteredCount}
                onPageChange={onPageChange}
                itemsPerPage={ITEMS_PER_PAGE}
                currPage={currPage}
                setCurrPage={setCurrPage}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
