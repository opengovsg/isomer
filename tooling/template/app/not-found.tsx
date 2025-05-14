import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { Metadata, ResolvingMetadata } from "next"
import Link from "next/link"
import Script from "next/script"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import { getMetadata, RenderEngine } from "@opengovsg/isomer-components"

export const dynamic = "force-static"

const PAGE_TITLE = "404: Page not found"
const PAGE_DESCRIPTION = "The page that you are accessing does not exist"
const PAGE_SCHEMA_VERSION = "0.1.0"

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

export const generateMetadata = async (
  _props: never,
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  // Context for using @/schema/not-found.json
  // For some next15 magical reason, using @/schema/_index.json will cause
  // duplicated generation of the homepage, resulting in wrong meta values
  // Suspected to be due to next15 changing app router SSG to render twice and in async manner
  // During deployment, publisher.sh duplicate homepage "_index.json" to "not-found.json"
  // For development, if `not-found.json` isn't found, simply manually copy and rename
  const schema = (await import(`@/schema/not-found.json`).then(
    (module) => module.default,
  )) as IsomerPageSchemaType
  schema.site = {
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    // TODO: fixup all the typing errors
    // @ts-ignore to fix when types are proper
    siteMap: sitemap,
    navbar: navbar,
    // TODO: fixup all the typing errors
    // @ts-ignore to fix when types are proper
    footerItems: footer,
    lastUpdated,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  }
  schema.page.permalink = "/404.html"
  schema.page.title = PAGE_TITLE
  schema.meta = {
    ...schema.meta,
    description: PAGE_DESCRIPTION,
  }
  return getMetadata(schema)
}

const NotFound = () => {
  return (
    <>
      <RenderEngine
        version={PAGE_SCHEMA_VERSION}
        site={{
          ...config.site,
          environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          // TODO: fixup all the typing errors
          // @ts-ignore to fix when types are proper
          siteMap: sitemap,
          navbar: navbar,
          // TODO: fixup all the typing errors
          // @ts-ignore to fix when types are proper
          footerItems: footer,
          assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
          isomerGtmId: process.env.NEXT_PUBLIC_ISOMER_GOOGLE_TAG_MANAGER_ID,
        }}
        layout="notfound"
        meta={{
          noIndex: true,
          description: PAGE_DESCRIPTION,
        }}
        page={{
          title: PAGE_TITLE,
          permalink: "/404.html",
          lastModified: new Date().toISOString(),
        }}
        content={[]}
        LinkComponent={Link}
        ScriptComponent={Script}
      />
    </>
  )
}

export default NotFound
