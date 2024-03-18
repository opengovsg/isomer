export interface FooterItem {
  title: string
  subItems?: FooterSubitem[]
  link?: string
}

export interface FooterSubitem {
  title: string
  link: string
}

export interface FooterProps {
  type: "footer"
  sectionIdx?: number
  agencyName: string
  lastUpdated: string
  items?: FooterItem[]
}

export default FooterProps
