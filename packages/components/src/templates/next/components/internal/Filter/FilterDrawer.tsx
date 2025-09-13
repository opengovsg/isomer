"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react"
import {
  Button as AriaButton,
  composeRenderProps,
  Label,
} from "react-aria-components"
import { BiChevronDown, BiX } from "react-icons/bi"

import type { AppliedFilter, FilterProps } from "../../../types/Filter"
import { tv } from "~/lib/tv"
import { focusRing } from "~/utils"
import { Button } from "../Button"
import { Checkbox, CheckboxGroup } from "../Checkbox"
import { IconButton } from "../IconButton"

const expandFilterButtonStyle = tv({
  extend: focusRing,
  base: "prose-headline-base-semibold flex w-full flex-row items-center justify-between gap-4 text-base-content",
})

interface FilterDrawerProps extends FilterProps {
  isOpen: boolean
  onOpen: (isOpen: boolean) => void
}

const transform = {
  toCheckboxes: (appliedFilters: AppliedFilter[]) => {
    return appliedFilters.reduce(
      (acc, { id, items }) => ({ ...acc, [id]: items.map(({ id }) => id) }),
      {} as Record<string, string[]>,
    )
  },
  toAppliedFilters: (holdingFiltersById: Record<string, string[]>) => {
    return Object.entries(holdingFiltersById)
      .map(([id, items]) => ({
        id,
        items: items.map((id) => ({ id })),
      }))
      .filter(({ items }) => items.length > 0)
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

  // Synchronize the applied filters with the holding filters
  useEffect(() => {
    setHoldingFiltersById(transform.toCheckboxes(initialAppliedFilters))
  }, [initialAppliedFilters])

  const updateFilterToggle = (filterId: string) => {
    setShowFilter((prevFilters) => ({
      ...prevFilters,
      [filterId]: !prevFilters[filterId],
    }))
  }

  const handleApplyFilters = () => {
    setAppliedFilters(transform.toAppliedFilters(holdingFiltersById))
    onOpen(false)
  }

  return (
    <>
      {/* Filters */}
      <form className="flex-1 px-6 md:px-10">
        {filters.map(({ id, label, items }) => (
          <CheckboxGroup
            className="border-b border-b-divider-medium py-4 last:border-0"
            key={id}
            value={holdingFiltersById[id] ?? []}
            onChange={(values) => {
              setHoldingFiltersById((prev) => ({
                ...prev,
                [id]: values,
              }))
            }}
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
                className={`mr-3 h-6 w-6 text-base-content-strong transition-all duration-300 ease-in-out ${
                  showFilter[id] ? "rotate-180" : "rotate-0"
                }`}
              />
            </AriaButton>

            <div className={showFilter[id] ? "flex flex-col" : "hidden"}>
              {items.map(({ id: itemId, label: itemLabel, count }) => (
                <Checkbox
                  value={itemId}
                  key={itemId}
                  className="w-fit cursor-pointer p-2"
                >
                  {itemLabel} ({count.toLocaleString()})
                </Checkbox>
              ))}
            </div>
          </CheckboxGroup>
        ))}
      </form>
      {/* Sticky action bottom bar */}
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
