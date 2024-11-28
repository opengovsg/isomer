import { Searchbar as OgpSearchBar } from "@opengovsg/design-system-react"

interface SearchBarProps {
  setSearchValue: (value: string) => void
}
export const SearchBar = ({ setSearchValue }: SearchBarProps) => {
  return (
    <OgpSearchBar
      defaultIsExpanded
      onChange={({ target }) => setSearchValue(target.value)}
      w="full"
      placeholder="Search pages, collections, or folders by name, or choose from the list below"
    />
  )
}
