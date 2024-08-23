"use client"

import { useRef } from "react"

import type { CollectionPageSchemaType } from "~/engine"
import type { BreadcrumbProps, CollectionCardProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import {
  BackToTopLink,
  CollectionCard,
  CollectionSearch,
  Filter,
  PaginationControls,
} from "../../components/internal"
import CollectionPageHeader from "./CollectionPageHeader"
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
    filterContainer: "relative col-span-12 pb-10 pt-8 lg:col-span-3",
    content: "col-span-12 flex flex-col gap-8 pt-8 lg:col-span-9 lg:ml-24",
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
  } = useCollection({ items })

  const articleContainerRef = useRef<HTMLDivElement>(null)
  const onPageChange = () => {
    articleContainerRef.current?.scrollIntoView({
      block: "start",
    })
  }
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
        <div className={compoundStyles.filterContainer()}>
          <Filter
            filters={filters}
            appliedFilters={appliedFilters}
            handleFilterToggle={handleFilterToggle}
            setAppliedFilters={setAppliedFilters}
            handleClearFilter={handleClearFilter}
          />
          <BackToTopLink className="hidden lg:flex" />
        </div>
        <div className={compoundStyles.content()} ref={articleContainerRef}>
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full flex-col justify-between gap-x-6 gap-y-2 md:flex-row">
              <div className="flex h-full w-full items-center gap-3">
                <p className="prose-headline-lg-regular text-base-content-medium">
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
