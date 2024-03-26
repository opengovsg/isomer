export interface CollectionSearchProps {
  type: "collectionSearch"
  placeholder: string
  search: string
  setSearch: (search: string) => void
}

export default CollectionSearchProps
