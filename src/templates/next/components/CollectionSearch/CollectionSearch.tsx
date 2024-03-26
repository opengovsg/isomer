import { BiSearch } from "react-icons/bi"
import { CollectionSearchProps } from "~/common"

const CollectionSearch = ({
  placeholder,
  search,
  setSearch,
}: Omit<CollectionSearchProps, "type">) => {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <span className="absolute inset-y-0 left-0 flex items-center pl-4">
        <BiSearch className="h-5 w-5 fill-interaction-support-placeholder" />
      </span>
      <input
        className="w-full rounded border-divider-medium pl-[3.25rem] py-3 placeholder:text-interaction-support-placeholder"
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
