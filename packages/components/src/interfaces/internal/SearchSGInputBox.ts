import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const SearchSGSearchSchema = Type.Object({
  type: Type.Literal("searchSG", { default: "searchSG" }),
  clientId: Type.String({
    title: "Client ID for SearchSG",
    description: "The client ID for SearchSG integration.",
  }),
})

export type SearchSGInputBoxProps = Static<typeof SearchSGSearchSchema>

export type NavbarSearchSGInputBoxProps = SearchSGInputBoxProps & {
  isOpen?: boolean
}

export type HomepageSearchSGInputBoxProps = SearchSGInputBoxProps & {
  className?: string
}
