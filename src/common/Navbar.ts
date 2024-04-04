import type { LocalSearchProps } from "./LocalSearchInputBox"
import type { SearchSGProps } from "./SearchSGInputBox"

export interface NavbarItem {
  name: string
  url: string
  description?: string
  items?: Omit<NavbarItem, "items">[]
}

export interface NavbarProps {
  type: "navbar"
  logoUrl: string
  logoAlt: string
  search?: LocalSearchProps | SearchSGProps
  items: NavbarItem[]
  LinkComponent?: any
  ScriptComponent?: any
}

export default NavbarProps
