import { Sitemap } from "~/engine/render"

export interface HeaderProps {
  type: "header"
  permalink: string
  sitemap: Sitemap
}

export default HeaderProps
