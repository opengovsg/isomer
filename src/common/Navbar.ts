interface NavbarLocalSearchProps {
  type: "localSearch"
  searchUrl: string
}

interface NavbarSearchSGProps {
  type: "searchSG"
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
}

export default NavbarProps
