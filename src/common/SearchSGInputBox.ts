export interface SearchSGProps {
  type: "searchSG"
  clientId: string
}

export interface SearchSGInputBoxProps extends SearchSGProps {
  ScriptComponent?: any // Next.js script
}

export default SearchSGInputBoxProps
