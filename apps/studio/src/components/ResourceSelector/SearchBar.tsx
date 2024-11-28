import { Searchbar as OgpSearchBar } from "@opengovsg/design-system-react"

interface SearchBarProps {
  searchValue: string
  setSearchValue: (value: string) => void
}
export const SearchBar = ({ searchValue, setSearchValue }: SearchBarProps) => {
  return (
    <OgpSearchBar
      defaultIsExpanded
      value={searchValue}
      onChange={({ target }) => setSearchValue(target.value)}
      w="full"
      placeholder="Search pages, collections, or folders by name, or choose from the list below"
    />
  )
}
