import type {
  DGSSearchableTableProps,
  NativeSearchableTableProps,
  SearchableTableProps,
} from "~/interfaces"
import {
  DGS_SEARCHABLE_TABLE_TYPE,
  NATIVE_SEARCHABLE_TABLE_TYPE,
} from "~/interfaces"
import { DGSSearchableTable } from "./DGS"
import { NativeSearchableTable } from "./Native"

// Type guards for proper type narrowing
const isNativeSearchableTable = (
  props: SearchableTableProps,
): props is NativeSearchableTableProps => {
  // check for undefined type is for backward compatibility
  // we can alternatively choose to do a patch on existing content to add the type field
  return (
    props.variant === NATIVE_SEARCHABLE_TABLE_TYPE ||
    props.variant === undefined
  )
}

const isDGSSearchableTable = (
  props: SearchableTableProps,
): props is DGSSearchableTableProps => {
  return props.variant === DGS_SEARCHABLE_TABLE_TYPE
}

export const SearchableTable = (props: SearchableTableProps) => {
  if (isNativeSearchableTable(props)) {
    return <NativeSearchableTable {...props} />
  }

  if (isDGSSearchableTable(props)) {
    return <DGSSearchableTable {...props} />
  }

  // This should never happen with proper typing, but provides a fallback
  const _exhaustiveCheck: never = props
  return null
}
