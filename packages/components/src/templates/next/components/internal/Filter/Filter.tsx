"use client"

import { useRef, useState } from "react"
import { mergeProps, useButton, useFocusRing } from "react-aria"
import { BiChevronDown, BiChevronRight } from "react-icons/bi"

import type { FilterProps } from "../../../types/Filter"
import { tv } from "~/lib/tv"
import { groupFocusVisibleHighlight } from "~/utils"
import { Button } from "../Button"
import { Checkbox, CheckboxGroup } from "../Checkbox"
import { FilterDrawer } from "./FilterDrawer"

const filterSectionLabelStyle = tv({
  extend: groupFocusVisibleHighlight,
})

const FilterSectionButton = ({
  label,
  isOpen,
  onToggle,
}: {
  label: string
  isOpen: boolean
  onToggle: () => void
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { buttonProps } = useButton({ onPress: onToggle }, buttonRef)
  const { focusProps } = useFocusRing()
  const mergedProps = mergeProps(buttonProps, focusProps)

  return (
    <button
      {...mergedProps}
      ref={buttonRef}
      className="group prose-headline-base-semibold flex w-full flex-row items-center justify-between gap-4 text-base-content outline-0"
    >
      <label className={filterSectionLabelStyle()}>{label}</label>
      <BiChevronDown
        aria-hidden
        className={`h-6 w-6 text-base-content-strong transition-all duration-300 ease-in-out ${
          isOpen ? "rotate-180" : "rotate-0"
        }`}
      />
    </button>
  )
}

export const Filter = ({
  filters,
  appliedFilters,
  handleFilterToggle,
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

  return (
    <>
      {filters.length > 0 && (
        <Button
          className="prose-headline-lg-semibold flex w-full items-center justify-between gap-1 rounded border-[1.5px] border-base-content-strong bg-white px-4 py-3.5 text-base-content-strong lg:hidden"
          variant="unstyled"
          onPress={() => setMobileFiltersOpen(true)}
        >
          Filter results
          <BiChevronRight className="h-6 w-6 shrink-0" />
        </Button>
      )}
      <FilterDrawer
        appliedFilters={appliedFilters}
        filters={filters}
        handleClearFilter={handleClearFilter}
        isOpen={mobileFiltersOpen}
        onOpen={setMobileFiltersOpen}
        handleFilterToggle={handleFilterToggle}
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
        {filters.map(({ id, label, items }) => (
          <CheckboxGroup
            className="border-b border-b-divider-medium py-4"
            key={id}
            value={appliedItemsById[id] ?? []}
          >
            <FilterSectionButton
              label={label}
              isOpen={showFilter[id] ?? false}
              onToggle={() => updateFilterToggle(id)}
            />

            <div className={showFilter[id] ? "flex flex-col" : "hidden"}>
              {items.map(({ id: itemId, label: itemLabel, count }) => (
                <Checkbox
                  key={itemId}
                  className="w-fit cursor-pointer p-2"
                  value={itemId}
                  onChange={() => handleFilterToggle(id, itemId)}
                >
                  {itemLabel} ({count.toLocaleString()})
                </Checkbox>
              ))}
            </div>
          </CheckboxGroup>
        ))}
        {filters.length === 0 && (
          <p className="prose-body-base py-4 italic text-base-content">
            Nothing to filter by
          </p>
        )}
      </aside>
    </>
  )
}
