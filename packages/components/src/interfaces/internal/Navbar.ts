import type { LocalSearchProps } from "./LocalSearchInputBox"
import type { SearchSGInputBoxProps } from "./SearchSGInputBox"
import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
  ScriptComponentType,
} from "~/types"
import { ImageClientProps } from "./Image"

export interface NavbarItem {
  name: string
  url: string
  description?: string
  items?: Omit<NavbarItem, "items">[]
  referenceLinkHref?: string
}

export interface BaseNavbarProps {
  layout: IsomerPageLayoutType
  search?: LocalSearchProps | SearchSGInputBoxProps
  items: NavbarItem[]
  LinkComponent?: LinkComponentType
  ScriptComponent?: ScriptComponentType
}

export interface NavbarProps extends BaseNavbarProps {
  logoUrl: string
  logoAlt: string
  site: IsomerSiteProps
}

export interface NavbarClientProps extends BaseNavbarProps {
  imageClientProps: ImageClientProps
}
