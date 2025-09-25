import type { NavbarItemsSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import type { Tagged } from "type-fest"

export type NavbarItems = Static<typeof NavbarItemsSchema>
export type NavbarItemPath = Tagged<string, "NavbarItemPath">
