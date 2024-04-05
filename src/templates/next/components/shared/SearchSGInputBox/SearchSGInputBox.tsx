import type SearchSGInputBoxProps from "~/common/SearchSGInputBox"

const SearchSGInputBox = ({
  clientId,
  ScriptComponent = "script",
}: Omit<SearchSGInputBoxProps, "type">) => {
  return (
    <>
      <ScriptComponent
        id="searchsg-config"
        src={`https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}`}
        defer
      ></ScriptComponent>
      <div id="searchsg-searchbar" />
    </>
  )
}

export default SearchSGInputBox
