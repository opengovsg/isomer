import { useState } from "react"
import { BiChevronDown } from "react-icons/bi"
import { FilterProps } from "~/common"
import { Heading } from "../../typography/Heading"

const Filter = ({
  filters,
  appliedFilters,
  setAppliedFilters,
}: Omit<FilterProps, "type">) => {
  const [showFilter, setShowFilter] = useState<Record<string, boolean>>({})

  const updateAppliedFilters = (filterId: string, itemId: string) => {
    const filterIndex = appliedFilters.findIndex(
      (filter) => filter.id === filterId,
    )
    if (filterIndex > -1) {
      const itemIndex = appliedFilters[filterIndex].items.findIndex(
        (item) => item.id === itemId,
      )
      if (itemIndex > -1) {
        const newAppliedFilters = [...appliedFilters]
        newAppliedFilters[filterIndex].items.splice(itemIndex, 1)
        setAppliedFilters(newAppliedFilters)
      } else {
        const newAppliedFilters = [...appliedFilters]
        newAppliedFilters[filterIndex].items.push({ id: itemId })
        setAppliedFilters(newAppliedFilters)
      }
    } else {
      setAppliedFilters([
        ...appliedFilters,
        { id: filterId, items: [{ id: itemId }] },
      ])
    }
  }

  const updateFilterToggle = (filterId: string) => {
    setShowFilter({ ...showFilter, [filterId]: !showFilter[filterId] })
  }

  return (
    <div className="flex flex-col divide-y divide-divider-medium last:border-b last:border-b-divider-medium">
      <h5 className={`${Heading[5]} py-4`}>Filter by</h5>
      {filters.map(({ id, label, items }) => (
        <div className="py-4" key={id}>
          <button
            className="flex flex-row w-full"
            onClick={() => updateFilterToggle(id)}
          >
            <h5 className={`${Heading[5]} text-content-medium`}>{label}</h5>
            <div className="flex-1"></div>
            <BiChevronDown
              className={`text-2xl text-content-medium transition-all duration-300 ease-in-out ${
                showFilter[id] ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          <div
            className={`flex flex-col w-full pt-4 gap-3 text-content-medium ${
              showFilter[id] ? "block" : "hidden"
            }`}
          >
            {items.map(({ id: itemId, label: itemLabel, count }) => (
              <label
                htmlFor={itemId}
                className="flex flex-row align-middle w-full px-1 py-2 hover:bg-interaction-main-subtle-hover has-[:focus]:ring-2 has-[:focus]:ring-focus-outline"
              >
                <input
                  type="checkbox"
                  className="h-6 w-6 rounded-sm border-2 border-divider-medium text-interaction-main group-focus:ring-2 group-focus:ring-focus-outline focus:ring-0"
                  id={itemId}
                  name={itemId}
                  checked={appliedFilters
                    .find((filter) => filter.id === id)
                    ?.items.some((item) => item.id === itemId)}
                  onChange={() => updateAppliedFilters(id, itemId)}
                />
                <p className="ml-4 inline-block">
                  {itemLabel}
                  {count && ` (${count.toLocaleString()})`}
                </p>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Filter
