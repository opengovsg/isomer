import type { NativeSearchableTableProps } from "~/interfaces"
import { HYPERLINK_EXCEL_FUNCTION } from "./constants"
import { SearchableTableClient } from "./SearchableTableClient"

const SearchableTable = ({ items, ...rest }: NativeSearchableTableProps) => {
  const cacheItems = items.map((item) => ({
    row: item,
    key: item
      .map((content) => {
        if (
          typeof content === "string" &&
          content.startsWith(HYPERLINK_EXCEL_FUNCTION) &&
          content.endsWith(")")
        ) {
          const link = content.slice(HYPERLINK_EXCEL_FUNCTION.length, -1)
          const [linkHref, linkText] = link.split(",")

          return linkText || linkHref
        }

        return content
      })
      .join(" ")
      .toLowerCase(),
  }))

  return <SearchableTableClient items={cacheItems} {...rest} />
}

export default SearchableTable
