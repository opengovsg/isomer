"use client"

import { useButton } from "@react-aria/button"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"
import { useRef, useState } from "react"
import { BiChevronDown, BiChevronRight } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"

import type { FilterProps } from "../../../types/Filter"
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
      className="group prose-headline-base-semibold text-base-content flex w-full flex-row items-center justify-between gap-4 text-left outline-0"
    >
      <label className={filterSectionLabelStyle()}>{label}</label>
      <BiChevronDown
        aria-hidden
        className={`text-base-content-strong h-6 w-6 shrink-0 transition-all duration-300 ease-in-out ${
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
          className="prose-headline-lg-semibold border-base-content-strong text-base-content-strong flex w-full items-center justify-between gap-1 rounded border-[1.5px] bg-white px-4 py-3.5 lg:hidden"
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
        <div className="border-b-base-divider-medium flex flex-row items-center justify-between gap-4 border-b pb-3">
          <h2 className="prose-headline-lg-semibold text-base-content-strong">
            Filters
          </h2>
          {appliedFilters.length > 0 && (
            <Button
              className="text-link min-h-fit p-0"
              variant="unstyled"
              onPress={handleClearFilter}
            >
              Clear all filters
            </Button>
          )}
        </div>
        {filters.map(({ id, label, items }) => (
          <CheckboxGroup
            className="border-b-divider-medium border-b py-4"
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
          <p className="prose-body-base text-base-content py-4 italic">
            Nothing to filter by
          </p>
        )}
      </aside>
    </>
  )
}
