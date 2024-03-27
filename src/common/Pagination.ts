export interface PaginationProps {
  type: "pagination"
  totalItems: number
  itemsPerPage: number
  currPage: number
  setCurrPage: (page: number) => void
}

export default PaginationProps
