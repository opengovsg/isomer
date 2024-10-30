import type { LocalSearchProps } from "./LocalSearchInputBox"
import type { SearchSGInputBoxProps } from "./SearchSGInputBox"
import type { ImageClientProps } from "~/templates/next/components/complex/Image"
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
  referenceLinkHref?: string
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

export interface NavbarClientProps {
  layout: IsomerPageLayoutType
  search?: LocalSearchProps | SearchSGInputBoxProps
  items: NavbarItem[]
  imageClientProps: ImageClientProps
  LinkComponent?: LinkComponentType
  ScriptComponent?: ScriptComponentType
}
