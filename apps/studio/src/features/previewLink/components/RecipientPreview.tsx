import type {
  IsomerGeneratedSiteProps,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import type { ComponentProps, PropsWithChildren } from "react"
import {
  LinkComponentProvider,
  RenderEngine,
} from "@opengovsg/isomer-components"
import { merge } from "lodash-es"
import Script from "next/script"
import { forwardRef } from "react"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

type RenderEngineProps = ComponentProps<typeof RenderEngine>
type RenderEngineSite = RenderEngineProps["site"]

export interface RecipientPreviewProps {
  pageContent: IsomerSchema
  permalink: string
  lastModified: string
  siteConfig: Record<string, unknown>
  navbar: unknown
  footer: unknown
  siteMap: IsomerGeneratedSiteProps["siteMap"]
}

// Anchor that swallows clicks — recipients should not be able to navigate
// out of the previewed page (links to other pages in the draft site won't
// resolve via this route).
const InertLink = forwardRef<HTMLAnchorElement, PropsWithChildren<unknown>>(
  ({ children, ...rest }, ref) => (
    <a {...rest} ref={ref} onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  ),
)
InertLink.displayName = "InertLink"

export const RecipientPreview = ({
  pageContent,
  permalink,
  lastModified,
  siteConfig,
  navbar,
  footer,
  siteMap,
}: RecipientPreviewProps): JSX.Element => {
  const renderProps = merge({}, pageContent, {
    page: { permalink, lastModified },
  }) as IsomerSchema

  // The site prop's exact shape (IsomerSiteWideComponentsProps) varies per
  // theme; mirroring the type here would mean tracking theme-specific
  // variants. RenderEngine validates the structure at runtime — the same
  // cast pattern is used by the editor's preview component.
  const site = {
    ...siteConfig,
    navbar,
    footerItems: footer,
    siteMap,
    environment: "production",
    search: { type: "localSearch", searchUrl: "/search" },
    assetsBaseUrl: ASSETS_BASE_URL,
  } as unknown as RenderEngineSite

  // RenderEngine's prop type is a discriminated union of page schema variants
  // intersected with site config; the generic IsomerSchema doesn't satisfy any
  // single variant statically, and ScriptComponent (consumed for analytics
  // scripts) isn't in the public type signature. The data is validated at
  // runtime by the editor pipeline before it ever reaches the DB. This cast
  // mirrors the escape hatch used by the editor's PreviewWithCustomSitemap.
  const fullProps = {
    ...renderProps,
    site,
    ScriptComponent: Script,
  } as unknown as ComponentProps<typeof RenderEngine>

  return (
    <LinkComponentProvider value={InertLink}>
      <RenderEngine {...fullProps} />
    </LinkComponentProvider>
  )
}
