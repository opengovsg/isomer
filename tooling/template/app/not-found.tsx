import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { Metadata, ResolvingMetadata } from "next"
import Link from "next/link"
import Script from "next/script"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import { getMetadata, RenderEngine } from "@opengovsg/isomer-components"

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
  const schema = (await import(`@/schema/_index.json`).then(
    (module) => module.default,
  )) as IsomerPageSchemaType
  schema.site = {
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    // TODO: fixup all the typing errors
    // @ts-ignore to fix when types are proper
    siteMap: sitemap,
    navBarItems: navbar,
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
          navBarItems: navbar,
          // TODO: fixup all the typing errors
          // @ts-ignore to fix when types are proper
          footerItems: footer,
          assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
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
