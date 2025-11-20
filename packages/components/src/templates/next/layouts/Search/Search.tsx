import type { SearchPageSchemaType } from "~/types/schema"
import { Skeleton } from "../Skeleton"
import { SearchSG } from "./SearchSG"

export const SearchLayout = ({
  site,
  page,
  layout,
  LinkComponent,
}: SearchPageSchemaType) => {
  const clientId =
    (site.search?.type === "searchSG" && site.search.clientId) || ""

  return (
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
    >
      {/* SearchSG-powered search */}
      {site.search?.type === "searchSG" && clientId && (
        <SearchSG clientId={clientId} />
      )}
    </Skeleton>
  )
}
