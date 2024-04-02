interface NavbarLocalSearchProps {
  type: "localSearch"
  searchUrl: string
}

interface NavbarSearchSGProps {
  type: "searchSG"
  clientId: string
}

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
  search?: NavbarLocalSearchProps | NavbarSearchSGProps
  items: NavbarItem[]
  LinkComponent?: any
  ScriptComponent?: any
}

export default NavbarProps
