import { SearchSGPageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"

const SearchSGLayout = ({
  site,
  page,
  LinkComponent = "a",
  HeadComponent = "head",
  ScriptComponent = "script",
}: SearchSGPageSchema) => {
  const clientId =
    (site.search && site.search.type === "searchSG" && site.search.clientId) ||
    ""

  return (
    <Skeleton
      site={site}
      page={page}
      LinkComponent={LinkComponent}
      HeadComponent={HeadComponent}
      ScriptComponent={ScriptComponent}
    >
      <ScriptComponent
        id="searchsg-config"
        src={`https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}&page=result`}
        defer
      />
      <div id="searchsg-result-container" />
    </Skeleton>
  )
}

export default SearchSGLayout
