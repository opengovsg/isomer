"use client"

import { useState } from "react"
import {
  Button as AriaButton,
  composeRenderProps,
  Label,
} from "react-aria-components"
import { BiChevronDown, BiChevronRight } from "react-icons/bi"

import type { FilterProps } from "../../../types/Filter"
import { tv } from "~/lib/tv"
import { focusRing } from "~/utils/focusRing"
import { groupFocusVisibleHighlightNonRac } from "~/utils/rac"
import { Button } from "../Button"
import { Checkbox, CheckboxGroup } from "../Checkbox"
import { FilterDrawer } from "./FilterDrawer"

const filterSectionLabelStyle = tv({
  extend: groupFocusVisibleHighlightNonRac,
})

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
            <AriaButton
              className="group prose-headline-base-semibold flex w-full flex-row items-center justify-between gap-4 text-base-content outline-0"
              onPress={() => updateFilterToggle(id)}
            >
              <Label className={filterSectionLabelStyle()}>{label}</Label>
              <BiChevronDown
                aria-hidden
                className={`h-6 w-6 text-base-content-strong transition-all duration-300 ease-in-out ${
                  showFilter[id] ? "rotate-180" : "rotate-0"
                }`}
              />
            </AriaButton>

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
