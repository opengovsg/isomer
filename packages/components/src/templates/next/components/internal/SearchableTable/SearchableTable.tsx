import type { SearchableTableProps } from "~/interfaces"
import { DGSSearchableTable } from "./DGS"
import { NativeSearchableTable } from "./Native"

export const SearchableTable = (props: SearchableTableProps) => {
  // Check if this is a native searchable table (has items property)
  // TODO: use better way to check
  if ("items" in props) {
    return <NativeSearchableTable {...props} />
  }

  // Handle DGS searchable table
  return <DGSSearchableTable {...props} />
}
