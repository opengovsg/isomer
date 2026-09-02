"use client"

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react"
import { useEffect, useState } from "react"
import { BiX } from "react-icons/bi"

import type { AppliedFilter, Filter, FilterProps } from "../../../types/Filter"
import { Button } from "../Button"
import { IconButton } from "../IconButton"
import { FilterSection } from "./FilterSection"

interface FilterDrawerProps extends FilterProps {
  filters: Filter[]
  isOpen: boolean
  onOpen: (isOpen: boolean) => void
}

type DateRangesById = Record<string, AppliedFilter["dateRange"]>

const transform = {
  toCheckboxes: (appliedFilters: AppliedFilter[]) => {
    return appliedFilters.reduce(
      (acc, { id, items }) => ({ ...acc, [id]: items.map(({ id }) => id) }),
      {} as Record<string, string[]>,
    )
  },
  toDateRanges: (appliedFilters: AppliedFilter[]): DateRangesById => {
    return appliedFilters.reduce(
      (acc, { id, dateRange }) =>
        dateRange ? { ...acc, [id]: dateRange } : acc,
      {} as DateRangesById,
    )
  },
  toAppliedFilters: (
    holdingFiltersById: Record<string, string[]>,
    holdingDateRangesById: DateRangesById,
  ) => {
    const ids = new Set([
      ...Object.keys(holdingFiltersById),
      ...Object.keys(holdingDateRangesById),
    ])
    return Array.from(ids)
      .map((id) => ({
        id,
        items: (holdingFiltersById[id] ?? []).map((itemId) => ({ id: itemId })),
        dateRange: holdingDateRangesById[id],
      }))
      .filter(({ items, dateRange }) => items.length > 0 || dateRange)
  },
}

const FilterDrawerContent = ({
  onOpen,
  filters,
  appliedFilters: initialAppliedFilters,
  handleClearFilter,
  setAppliedFilters,
}: FilterDrawerProps) => {
  const [showFilter, setShowFilter] = useState<Record<string, boolean>>(
    filters.reduce((acc, { id }) => ({ ...acc, [id]: true }), {}),
  )

  const [holdingFiltersById, setHoldingFiltersById] = useState(
    transform.toCheckboxes(initialAppliedFilters),
  )
  const [holdingDateRangesById, setHoldingDateRangesById] = useState(
    transform.toDateRanges(initialAppliedFilters),
  )

  useEffect(() => {
    setHoldingFiltersById(transform.toCheckboxes(initialAppliedFilters))
    setHoldingDateRangesById(transform.toDateRanges(initialAppliedFilters))
  }, [initialAppliedFilters])

  const updateFilterToggle = (filterId: string) => {
    setShowFilter((prevFilters) => ({
      ...prevFilters,
      [filterId]: !prevFilters[filterId],
    }))
  }

  const handleApplyFilters = () => {
    setAppliedFilters(
      transform.toAppliedFilters(holdingFiltersById, holdingDateRangesById),
    )
    onOpen(false)
  }

  return (
    <>
      <form className="flex-1 px-6 md:px-10">
        {filters.map((filter) => (
          <FilterSection
            key={filter.id}
            filter={filter}
            className="border-b border-b-divider-medium py-4 last:border-0"
            headerVariant="drawer"
            commitMode="staged"
            dateRangePresentation="modal"
            isExpanded={showFilter[filter.id] ?? false}
            onToggleExpanded={() => updateFilterToggle(filter.id)}
            selectedItemIds={holdingFiltersById[filter.id] ?? []}
            dateRange={holdingDateRangesById[filter.id]}
            onSelectionChange={(values) => {
              setHoldingFiltersById((prev) => ({
                ...prev,
                [filter.id]: values,
              }))
            }}
            onDateRangeChange={(dateRange) =>
              setHoldingDateRangesById((prev) => ({
                ...prev,
                [filter.id]: dateRange,
              }))
            }
          />
        ))}
      </form>
      <div className="sticky bottom-0 left-0 right-0 flex flex-col gap-3 border-t border-t-divider-medium bg-white px-6 pb-12 pt-8 md:px-10">
        <Button
          className="w-full justify-center"
          variant="solid"
          size="lg"
          onPress={handleApplyFilters}
        >
          Apply filters
        </Button>
        <Button
          size="lg"
          className="w-full justify-center"
          variant="outline"
          onPress={handleClearFilter}
        >
          Clear all filters
        </Button>
      </div>
    </>
  )
}

export const FilterDrawer = (props: FilterDrawerProps): JSX.Element => {
  const { isOpen, onOpen } = props

  return (
    <Dialog open={isOpen} onClose={onOpen} className="relative z-40 lg:hidden">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 z-40 flex">
        <DialogPanel
          transition
          className="relative ml-auto flex h-full w-full transform flex-col overflow-y-auto bg-white transition duration-300 ease-in-out data-[closed]:translate-y-full"
        >
          <div className="mx-6 flex items-center justify-between border-b border-b-divider-medium pb-3 pt-12 md:mx-10">
            <h2 className="prose-title-lg-medium text-base-content-medium">
              Filters
            </h2>
            <IconButton
              icon={BiX}
              onPress={() => onOpen(false)}
              aria-label="Close filter menu"
            />
          </div>

          <FilterDrawerContent {...props} key={String(isOpen)} />
        </DialogPanel>
      </div>
    </Dialog>
  )
}
