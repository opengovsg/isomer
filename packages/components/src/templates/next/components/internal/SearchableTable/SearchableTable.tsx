import type {
  DGSSearchableTableProps,
  NativeSearchableTableProps,
  SearchableTableProps,
} from "~/interfaces"
import { DATA_SOURCE_TYPE } from "~/interfaces/integration"

import { DGSSearchableTable } from "./DGS"
import { NativeSearchableTable } from "./Native"

const isNativeSearchableTableProps = (
  props: SearchableTableProps,
): props is NativeSearchableTableProps =>
  !props.dataSource || props.dataSource.type === DATA_SOURCE_TYPE.native

const isDgsSearchableTableProps = (
  props: SearchableTableProps,
): props is DGSSearchableTableProps =>
  props.dataSource?.type === DATA_SOURCE_TYPE.dgs

export const SearchableTable = (props: SearchableTableProps) => {
  if (isDgsSearchableTableProps(props)) {
    return <DGSSearchableTable {...props} />
  }

  if (isNativeSearchableTableProps(props)) {
    return <NativeSearchableTable {...props} />
  }

  return null
}
