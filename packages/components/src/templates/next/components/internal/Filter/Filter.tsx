"use client"

import { useState } from "react"
import { BiChevronRight } from "react-icons/bi"

import type { FilterProps } from "../../../types/Filter"
import { Button } from "../Button"
import { FilterDrawer } from "./FilterDrawer"
import { FilterSection } from "./FilterSection"

export const Filter = ({
  filters,
  appliedFilters,
  handleFilterToggle,
  handleDateRangeChange,
  handleClearFilter,
  setAppliedFilters,
}: FilterProps) => {
  const [showFilter, setShowFilter] = useState<Record<string, boolean>>(
    filters.reduce((acc, { id }) => ({ ...acc, [id]: true }), {}),
  )

  const appliedItemsById = appliedFilters.reduce(
    (acc, { id, items }) => ({ ...acc, [id]: items.map(({ id }) => id) }),
    {} as Record<string, string[]>,
  )

  const updateFilterToggle = (filterId: string) => {
    setShowFilter((prevFilters) => ({
      ...prevFilters,
      [filterId]: !prevFilters[filterId],
    }))
  }

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  if (filters.length === 0) {
    return null
  }

  return (
    <>
      <Button
        className="prose-headline-lg-semibold flex w-full items-center justify-between gap-1 rounded border-[1.5px] border-base-content-strong bg-white px-4 py-3.5 text-base-content-strong lg:hidden"
        variant="unstyled"
        onPress={() => setMobileFiltersOpen(true)}
      >
        Filter results
        <BiChevronRight className="h-6 w-6 shrink-0" />
      </Button>
      <FilterDrawer
        appliedFilters={appliedFilters}
        filters={filters}
        handleClearFilter={handleClearFilter}
        isOpen={mobileFiltersOpen}
        onOpen={setMobileFiltersOpen}
        handleFilterToggle={handleFilterToggle}
        handleDateRangeChange={handleDateRangeChange}
        setAppliedFilters={setAppliedFilters}
      />
      <aside className="hidden lg:block">
        <div className="flex flex-row items-center justify-between gap-4 border-b border-b-base-divider-medium pb-3">
          <h2 className="prose-headline-lg-semibold text-base-content-strong">
            Filters
          </h2>
          {appliedFilters.length > 0 && (
            <Button
              className="min-h-fit p-0 text-link"
              variant="unstyled"
              onPress={handleClearFilter}
            >
              Clear all filters
            </Button>
          )}
        </div>
        {filters.map((filter) => (
          <FilterSection
            key={filter.id}
            filter={filter}
            className="border-b border-b-divider-medium py-4"
            headerVariant="sidebar"
            commitMode="immediate"
            isExpanded={showFilter[filter.id] ?? false}
            onToggleExpanded={() => updateFilterToggle(filter.id)}
            selectedItemIds={appliedItemsById[filter.id] ?? []}
            dateRange={
              appliedFilters.find(
                (appliedFilter) => appliedFilter.id === filter.id,
              )?.dateRange
            }
            onItemToggle={(itemId) => handleFilterToggle(filter.id, itemId)}
            onDateRangeChange={(dateRange) =>
              handleDateRangeChange(filter.id, dateRange)
            }
          />
        ))}
      </aside>
    </>
  )
}
