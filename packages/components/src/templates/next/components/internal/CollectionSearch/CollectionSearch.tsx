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
        <BiSearch className="fill-interaction-support-placeholder h-5 w-5" />
      </span>
      <input
        className="ring-divider-medium placeholder:text-interaction-support-placeholder focus:ring-focus-outline active:bg-interaction-main-subtle-hover active:ring-focus-outline w-full rounded-lg py-4 pl-[3.25rem] focus:ring-2 active:ring-2"
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
