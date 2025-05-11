import type { ImageClientProps } from "./Image"
import type { LocalSearchProps } from "./LocalSearchInputBox"
import type { SearchSGInputBoxProps } from "./SearchSGInputBox"
import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
  ScriptComponentType,
} from "~/types"

// TODO: add typebox schema and limit label to 30 characters
interface NavbarCallToAction {
  label: string
}

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
  callToAction?: NavbarCallToAction & {
    url: string
  }
  site: IsomerSiteProps
}

export interface NavbarClientProps extends BaseNavbarProps {
  callToAction?: NavbarCallToAction & {
    referenceLinkHref?: string
    isExternal: boolean
  }
  imageClientProps: ImageClientProps
}
