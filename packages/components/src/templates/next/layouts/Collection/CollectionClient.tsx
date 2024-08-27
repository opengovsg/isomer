"use client"

import { useRef } from "react"

import type { CollectionPageSchemaType } from "~/engine"
import type { BreadcrumbProps, CollectionCardProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import {
  BackToTopLink,
  CollectionSearch,
  Filter,
  PaginationControls,
} from "../../components/internal"
import CollectionPageHeader from "./CollectionPageHeader"
import { CollectionResults } from "./CollectionResults"
import { ITEMS_PER_PAGE, useCollection } from "./useCollection"

interface CollectionClientProps {
  page: CollectionPageSchemaType["page"]
  LinkComponent: CollectionPageSchemaType["LinkComponent"]
  items: CollectionCardProps[]
  breadcrumb: BreadcrumbProps
}

const createCollectionLayoutStyles = tv({
  slots: {
    container:
      "relative mx-auto grid max-w-screen-xl grid-cols-12 px-6 pb-16 pt-8 md:px-10 lg:gap-6 xl:gap-10",
    filterContainer: "relative col-span-12 pb-2 pt-8 lg:col-span-3 lg:pb-10",
    content: "col-span-12 flex flex-col gap-8 pt-8 lg:col-span-9 lg:ml-24",
  },
  variants: {
    hasNoFilters: {
      true: {
        filterContainer: "hidden lg:block",
        content: "pt-0",
      },
    },
  },
})

const compoundStyles = createCollectionLayoutStyles()

const CollectionClient = ({
  page,
  LinkComponent,
  items,
  breadcrumb,
}: CollectionClientProps) => {
  const {
    filters,
    paginatedItems,
    filteredCount,
    searchValue,
    appliedFilters,
    handleFilterToggle,
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

  const hasNoFilters = filters.length === 0

  return (
    <>
      <CollectionPageHeader
        title={page.title}
        subtitle={page.subtitle}
        breadcrumb={breadcrumb}
        LinkComponent={LinkComponent}
      >
        <CollectionSearch
          placeholder={`Search for ${page.title.toLowerCase()}`}
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
            setAppliedFilters={setAppliedFilters}
            handleClearFilter={handleClearFilter}
          />
          <BackToTopLink className="hidden lg:flex" />
        </div>
        <div
          className={compoundStyles.content({
            hasNoFilters,
          })}
          ref={articleContainerRef}
        >
          <div className="flex w-full flex-col gap-3">
            <CollectionResults
              appliedFilters={appliedFilters}
              filteredCount={filteredCount}
              handleClearFilter={handleClearFilter}
              paginatedItems={paginatedItems}
              searchValue={searchValue}
              totalCount={totalCount}
              LinkComponent={LinkComponent}
            />
          </div>
          {paginatedItems.length > 0 && (
            <div className="flex w-full justify-center lg:justify-end">
              <PaginationControls
                totalItems={filteredCount}
                onPageChange={onPageChange}
                itemsPerPage={ITEMS_PER_PAGE}
                currPage={currPage}
                setCurrPage={setCurrPage}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CollectionClient
