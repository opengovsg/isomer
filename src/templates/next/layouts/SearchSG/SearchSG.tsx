import { SearchSGPageSchema } from "~/engine"
import { Skeleton } from "../Skeleton"

const SearchSGLayout = ({
  site,
  page,
  ScriptComponent = "script",
}: SearchSGPageSchema) => {
  const clientId =
    (site.search && site.search.type === "searchSG" && site.search.clientId) ||
    ""

  return (
    <Skeleton site={site} page={page}>
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
