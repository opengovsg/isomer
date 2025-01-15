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
  shouldBlockIndexing,
} from "@opengovsg/isomer-components"

export const dynamic = "force-static"

const INDEX_PAGE_PERMALINK = "_index"

interface ParamsContent {
  permalink: string[]
}
interface DynamicPageProps {
  params: Promise<ParamsContent>
}

// Note: permalink should not be able to be undefined
// However, nextjs had some magic props passing going on that causes
// { permalink: [""] } to be converted to {}
// Thus the patch is necessary to convert it back if its undefined
const getPatchedPermalink = async (
  props: DynamicPageProps,
): Promise<ParamsContent["permalink"]> => {
  const params = await props.params
  return params.permalink ?? [""]
}

const timeNow = new Date()
const lastUpdated =
  timeNow.getDate().toString().padStart(2, "0") +
  " " +
  timeNow.toLocaleString("default", { month: "short" }) +
  " " +
  timeNow.getFullYear()

const getSchema = async ({ permalink }: Pick<ParamsContent, "permalink">) => {
  const joinedPermalink: string = permalink.join("/")

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
    ).lastModified || new Date().toISOString()

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
  props: DynamicPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  const schema = await getSchema({
    permalink: await getPatchedPermalink(props),
  })
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

const Page = async (props: DynamicPageProps) => {
  const renderSchema = await getSchema({
    permalink: await getPatchedPermalink(props),
  })

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
      meta={{
        // TODO: fixup all the typing errors
        // @ts-ignore to fix when types are proper
        noIndex: shouldBlockIndexing(
          process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
        ),
      }}
      LinkComponent={Link}
      ScriptComponent={Script}
    />
  )
}

export default Page
