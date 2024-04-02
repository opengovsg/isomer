import SearchSGInputBoxProps from "~/templates/next/types/SearchSGInputBox"

const SearchSGInputBox = ({
  clientId,
  ScriptComponent = "script",
}: SearchSGInputBoxProps) => {
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
