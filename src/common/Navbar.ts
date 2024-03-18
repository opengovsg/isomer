export interface NavbarLink {
  type: "single" | "dropdown"
  name: string
  eventKey?: string
  url?: string
  links?: NavbarLink[]
}

export interface IsomerNavProps {
  type: "navbar"
  id?: string
  logo: { url: string; alt: string }

  links: NavbarLink[]
  search?: {
    isEnabled: boolean
    searchUrl?: string
  }
}

export default IsomerNavProps
