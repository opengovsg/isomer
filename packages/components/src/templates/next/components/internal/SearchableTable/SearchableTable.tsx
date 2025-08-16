import type {
  DGSSearchableTableProps,
  NativeSearchableTableProps,
  SearchableTableProps,
} from "~/interfaces"
import { DATA_SOURCE_TYPE } from "~/interfaces/integration"
import { DGSSearchableTable } from "./DGS"
import { NativeSearchableTable } from "./Native"

export const SearchableTable = (props: SearchableTableProps) => {
  switch (props.dataSource?.type) {
    case DATA_SOURCE_TYPE.dgs:
      return <DGSSearchableTable {...(props as DGSSearchableTableProps)} />
    default:
      return (
        <NativeSearchableTable {...(props as NativeSearchableTableProps)} />
      )
  }
}
