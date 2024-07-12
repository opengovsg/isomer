import { BiSearch } from "react-icons/bi"

import type { CollectionSearchProps } from "../../../types/CollectionSearch"

const CollectionSearch = ({
  placeholder,
  search,
  setSearch,
}: CollectionSearchProps) => {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <span className="absolute inset-y-0 left-0 flex items-center pl-4">
        <BiSearch className="h-5 w-5 fill-interaction-support-placeholder" />
      </span>
      <input
        className="w-full rounded py-4 pl-[3.25rem] placeholder:gray-600 placeholder:text-base border-[1.5px] border-gray-900 ring-divider-medium placeholder:text-interaction-support-placeholder focus:ring-2 focus:ring-focus-outline active:bg-interaction-main-subtle-hover active:ring-2 active:ring-focus-outline"
        placeholder={placeholder}
        type="text"
        name="search"
        value={search}
        role="search"
        aria-label={placeholder}
        onChange={(e) => setSearch(e.target.value)}
      />
    </label>
  )
}

export default CollectionSearch
