// Build-time replacements for `@opengovsg/isomer-components`'s per-type
// component/layout modules, swapped in by next.config.mjs's webpack config
// for any type not present in the site's schema content. Every export here
// is a no-op — the real module is never reached because
// `NormalModuleReplacementPlugin` redirects the resolved file path before
// webpack ever parses the original, so its imports (and their cost) never
// enter the bundle.
//
// Only components/layouts confirmed to have no cross-imports from outside
// `render/renderComponent.tsx` / `render/renderLayout.tsx` are stubbed here
// (see COMPONENT_TARGETS/LAYOUT_TARGETS in next.config.mjs). Infobar,
// InfoCards, ContactInformation, Prose, and the NotFound layout are
// permanently excluded and never redirected to this file.

export const Accordion = () => null
export const AntiScamDisclaimerBanner = () => null
export const Audio = () => null
export const Blockquote = () => null
export const Callout = () => null
export const ChildrenPages = () => null
export const CollectionBlock = () => null
export const Contentpic = () => null
export const DynamicComponentList = () => null
export const DynamicDataBanner = () => null
export const FormSG = () => null
export const Hero = () => null
export const Iframe = () => null
export const Image = () => null
export const ImageGallery = () => null
export const InfoCols = () => null
export const Infopic = () => null
export const KeyStatistics = () => null
export const LogoCloud = () => null
export const Map = () => null
export const Video = () => null

export const ArticleLayout = () => null
export const CollectionLayout = () => null
export const ContentLayout = () => null
export const DatabaseLayout = () => null
export const HomepageLayout = () => null
export const IndexPageLayout = () => null
export const SearchLayout = () => null
