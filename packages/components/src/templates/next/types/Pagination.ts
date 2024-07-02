export interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currPage: number;
  setCurrPage: (page: number) => void;
}

export default PaginationProps;
