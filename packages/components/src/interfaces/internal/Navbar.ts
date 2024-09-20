import type { LocalSearchProps } from "./LocalSearchInputBox"
import type { SearchSGInputBoxProps } from "./SearchSGInputBox"
import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
  ScriptComponentType,
} from "~/types"

export interface NavbarItem {
  name: string
  url: string
  description?: string
  items?: Omit<NavbarItem, "items">[]
}

export interface NavbarProps {
  logoUrl: string
  logoAlt: string
  layout: IsomerPageLayoutType
  search?: LocalSearchProps | SearchSGInputBoxProps
  items: NavbarItem[]
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  ScriptComponent?: ScriptComponentType
}
