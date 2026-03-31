export interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currPage: number
  setCurrPage: (previousState: number) => void
}
