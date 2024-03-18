export type SearchRecord = {
  id: string
  title: string
  content: string
  url: string
}

export interface SearchProps {
  type: "search"
  index: SearchRecord[]
}

export default SearchProps
