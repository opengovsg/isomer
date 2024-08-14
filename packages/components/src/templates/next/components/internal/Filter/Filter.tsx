"use client"

import { useState } from "react"
import {
  Button as AriaButton,
  composeRenderProps,
  Label,
} from "react-aria-components"
import { BiChevronDown } from "react-icons/bi"

import type { FilterProps } from "../../../types/Filter"
import { tv } from "~/lib/tv"
import { focusRing } from "~/utils/focusRing"
import { Button } from "../Button"
import { Checkbox, CheckboxGroup } from "../Checkbox"

const expandFilterButtonStyle = tv({
  extend: focusRing,
  base: "prose-headline-base-semibold flex w-full flex-row items-center justify-between gap-4 text-base-content",
})

export const Filter = ({
  filters,
  appliedFilters,
  setAppliedFilters,
  handleClearFilter,
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

  return (
    <aside>
      <div className="flex flex-row items-center justify-between gap-4 border-b border-b-base-divider-medium pb-3">
        <h2 className="prose-headline-lg-semibold text-base-content-strong">
          Filters
        </h2>
        {appliedFilters.length > 0 && (
          <Button
            className="min-h-fit p-0 text-link"
            variant="clear"
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
            className={composeRenderProps("", (className, renderProps) =>
              expandFilterButtonStyle({
                ...renderProps,
                className,
              }),
            )}
            onPress={() => updateFilterToggle(id)}
          >
            <Label>{label}</Label>
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
                onChange={() => setAppliedFilters(id, itemId)}
              >
                {itemLabel} ({count.toLocaleString()})
              </Checkbox>
            ))}
          </div>
        </CheckboxGroup>
      ))}
    </aside>
  )
}
