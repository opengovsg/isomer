import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

const SearchSGClientIdSchema = Type.String({
  description:
    "If you’re facing any issues with SearchSG, contact Isomer Support.",
  readOnly: true,
  title: "Client ID for SearchSG",
})

export const SearchSGSearchSchema = Type.Object({
  clientId: SearchSGClientIdSchema,
  type: Type.Literal("searchSG", { default: "searchSG", format: "hidden" }),
})

export type SearchSGInputBoxProps = Static<typeof SearchSGSearchSchema>

export type NavbarSearchSGInputBoxProps = SearchSGInputBoxProps & {
  isOpen?: boolean
}

export type HomepageSearchSGInputBoxProps = SearchSGInputBoxProps & {
  className?: string
}
