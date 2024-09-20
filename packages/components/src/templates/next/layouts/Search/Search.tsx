import { type SearchPageSchemaType } from "~/engine"
import { Skeleton } from "../Skeleton"
import SearchSG from "./SearchSG"

const SearchLayout = ({
  site,
  page,
  layout,
  LinkComponent,
  ScriptComponent = "script",
}: SearchPageSchemaType) => {
  const clientId =
    (site.search && site.search.type === "searchSG" && site.search.clientId) ||
    ""

  return (
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
      ScriptComponent={ScriptComponent}
    >
      {/* Local search */}
      {site.search && site.search.type === "localSearch" && <></>}

      {/* SearchSG-powered search */}
      {site.search && site.search.type === "searchSG" && clientId && (
        <SearchSG clientId={clientId} />
      )}
    </Skeleton>
  )
}

export default SearchLayout
