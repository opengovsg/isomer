// Do not re-export ./render from here. Template clients import
// LinkComponentProvider through this barrel; bundling RenderEngine with it
// pulls Collection/Search/Database into every page.
export { LinkComponentProvider } from "~/templates/next/context/LinkComponentContext"
export { RenderApplicationScripts } from "./renderApplicationScripts"
export { RenderApplicationHeadScripts } from "./renderApplicationHeadScripts"
export {
  getMetadata,
  shouldBlockIndexing,
  getRobotsTxt,
  getSitemapXml,
} from "./metadata"
