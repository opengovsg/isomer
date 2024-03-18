import { Sitemap } from "~/engine/render"

export interface SidePaneProps {
  type: "sidepane"
  sitemap: Sitemap
  currentPermalink: string
}

export default SidePaneProps
