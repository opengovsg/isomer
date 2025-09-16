import type {
  DGSSearchableTableProps,
  NativeSearchableTableProps,
  SearchableTableProps,
} from "~/interfaces"
import { DATA_SOURCE_TYPE } from "~/interfaces/integration"
import { DGSSearchableTable } from "./DGS"
import { NativeSearchableTable } from "./Native"

export const SearchableTable = (props: SearchableTableProps) => {
  // For backward compatibility, where dataSource is not provided,
  if (!props.dataSource) {
    return <NativeSearchableTable {...(props as NativeSearchableTableProps)} />
  }

  const { type } = props.dataSource
  switch (type) {
    case DATA_SOURCE_TYPE.native:
      return (
        <NativeSearchableTable {...(props as NativeSearchableTableProps)} />
      )
    case DATA_SOURCE_TYPE.dgs:
      return <DGSSearchableTable {...(props as DGSSearchableTableProps)} />
    default:
      const _exhaustiveCheck: never = type
      return _exhaustiveCheck
  }
}
