import type { IsomerSitemap, LinkComponentType } from "~/types"
import { getReferenceLinkHref } from "~/utils"
import BaseParagraph from "../BaseParagraph"
import { HYPERLINK_EXCEL_FUNCTION } from "./constants"

interface CellContentProps {
  content: string | number
  sitemap: IsomerSitemap
  LinkComponent?: LinkComponentType
}

export const CellContent = ({
  content,
  sitemap,
  LinkComponent,
}: CellContentProps) => {
  if (
    typeof content === "string" &&
    content.startsWith(HYPERLINK_EXCEL_FUNCTION) &&
    content.endsWith(")")
  ) {
    const link = content.slice(HYPERLINK_EXCEL_FUNCTION.length, -1)
    const [linkHref, linkText] = link.split(",")

    return (
      <BaseParagraph
        content={`<a href=${getReferenceLinkHref(linkHref?.replace(/"/g, ""), sitemap)}>${linkText || linkHref || "Link"}</a>`}
        LinkComponent={LinkComponent}
      />
    )
  }

  return (
    <BaseParagraph content={String(content)} LinkComponent={LinkComponent} />
  )
}
