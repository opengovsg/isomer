import { type SearchPageSchemaType } from "~/engine"
import { Skeleton } from "../Skeleton"

const SearchLayout = ({
  site,
  page,
  layout,
  LinkComponent = "a",
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
        <>
          <ScriptComponent
            id="searchsg-config"
            src={`https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}&page=result`}
            defer
          />
          <div id="searchsg-result-container" className="h-[29.25rem]" />
        </>
      )}
    </Skeleton>
  )
}

export default SearchLayout
