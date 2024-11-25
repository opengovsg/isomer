import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { Metadata, ResolvingMetadata } from "next"
import Link from "next/link"
import Script from "next/script"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import {
  getMetadata,
  getSitemapXml,
  RenderEngine,
} from "@opengovsg/isomer-components"

const INDEX_PAGE_PERMALINK = "_index"
interface DynamicPageProps {
  params: {
    permalink?: string[]
  }
}

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

const getSchema = async (
  permalink: DynamicPageProps["params"]["permalink"],
) => {
  const joinedPermalink = !!permalink ? permalink.join("/") : ""

  const schema = (await import(`@/schema/${joinedPermalink}.json`)
    .then((module) => module.default)
    // NOTE: If the initial import is missing,
    // this might be the case where the file is an index page
    // and has `_index` appended to the original permalink
    // so we have to do another import w the appended index path
    .catch(async () => {
      if (joinedPermalink === "") {
        return import(`@/schema/${INDEX_PAGE_PERMALINK}.json`).then(
          (module) => module.default,
        )
      }

      return import(
        `@/schema/${joinedPermalink}/${INDEX_PAGE_PERMALINK}.json`
      ).then((module) => module.default)
    })) as IsomerPageSchemaType

  const lastModified =
    // TODO: fixup all the typing errors
    // @ts-expect-error to fix when types are proper
    getSitemapXml(sitemap).find(
      ({ url }) => joinedPermalink === url.replace(/^\//, ""),
    )?.lastModified || new Date().toISOString()

  schema.page.permalink = "/" + joinedPermalink
  schema.page.lastModified = lastModified

  return schema
}

export const generateStaticParams = () => {
  // TODO: fixup all the typing errors
  // @ts-expect-error to fix when types are proper
  return getSitemapXml(sitemap).map(({ url }) => ({
    permalink: url.replace(/^\//, "").split("/"),
  }))
}

export const generateMetadata = async (
  { params }: DynamicPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  const { permalink } = params
  const schema = await getSchema(permalink)
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
  return getMetadata(schema)
}

const Page = async ({ params }: DynamicPageProps) => {
  const { permalink } = params
  const renderSchema = await getSchema(permalink)

  return (
    <RenderEngine
      {...renderSchema}
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
        lastUpdated,
        assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
        isomerGtmId: process.env.NEXT_PUBLIC_ISOMER_GOOGLE_TAG_MANAGER_ID,
      }}
      LinkComponent={Link}
      ScriptComponent={Script}
    />
  )
}

export default Page
