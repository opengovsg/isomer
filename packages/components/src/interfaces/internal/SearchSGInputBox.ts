import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const SearchSGClientIdSchema = Type.String({
  title: "Client ID for SearchSG",
  description:
    "If you’re facing any issues with SearchSG, contact Isomer Support.",
  readOnly: true,
})

export const SearchSGSearchSchema = Type.Object({
  type: Type.Literal("searchSG", { default: "searchSG", format: "hidden" }),
  clientId: SearchSGClientIdSchema,
})

export type SearchSGInputBoxProps = Static<typeof SearchSGSearchSchema>

export type NavbarSearchSGInputBoxProps = SearchSGInputBoxProps & {
  isOpen?: boolean
}

export type HomepageSearchSGInputBoxProps = SearchSGInputBoxProps & {
  className?: string
}
