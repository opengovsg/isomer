import type { Dispatch, SetStateAction } from "react"

export interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currPage: number
  setCurrPage: Dispatch<SetStateAction<number>>
}

export default PaginationProps
