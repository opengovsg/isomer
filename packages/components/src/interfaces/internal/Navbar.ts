import type { LinkProps } from "./Link"
import type { LocalSearchProps } from "./LocalSearchInputBox"
import type { SearchSGInputBoxProps } from "./SearchSGInputBox"
import type { ImageClientProps } from "~/templates/next/components/complex/Image"
import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
  ScriptComponentType,
} from "~/types"

interface BaseNavbarItem {
  name: string
  description?: string
}

export interface NavbarItem extends BaseNavbarItem {
  url: string
  items?: NavbarItem[]
}

export interface ProcessedNavbarItem extends BaseNavbarItem {
  referenceLinkHref: LinkProps["href"]
  isExternal: LinkProps["isExternal"]
  items?: ProcessedNavbarItem[]
}

interface BaseNavbarProps {
  layout: IsomerPageLayoutType
  search?: LocalSearchProps | SearchSGInputBoxProps
  LinkComponent?: LinkComponentType
  ScriptComponent?: ScriptComponentType
}

export interface NavbarProps extends BaseNavbarProps {
  logoUrl: ImageClientProps["src"]
  logoAlt: ImageClientProps["alt"]
  site: IsomerSiteProps
  items: NavbarItem[]
}

export interface NavbarClientProps extends BaseNavbarProps {
  imageClientProps: ImageClientProps
  items: ProcessedNavbarItem[]
}
