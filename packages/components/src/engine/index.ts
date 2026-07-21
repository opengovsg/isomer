// Keep this barrel free of `./render` (RenderEngine → fat renderLayout).
// Client imports like LinkComponentProvider go through here via the package
// root; pulling renderLayout in would ship Collection/Search/Database to every
// page even when those layouts are never used on that route.
export { LinkComponentProvider } from "~/templates/next/context/LinkComponentContext"
export { RenderApplicationScripts } from "./renderApplicationScripts"
export { RenderApplicationHeadScripts } from "./renderApplicationHeadScripts"
export {
  getMetadata,
  shouldBlockIndexing,
  getRobotsTxt,
  getSitemapXml,
} from "./metadata"
