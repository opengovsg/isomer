import type { IsomerPageSchema } from "@opengovsg/isomer-components"
import type { Metadata } from "next"
import Link from "next/link"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import {
  getMetadata,
  getSitemapXml,
  RenderEngine,
} from "@opengovsg/isomer-components"

interface DynamicPageProps {
  params: {
    permalink: string[]
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (permalink && permalink.length > 0 && typeof permalink !== "string") {
    const joinedPermalink = permalink.join("/")

    const schema = (await import(`@/schema/${joinedPermalink}.json`).then(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      (module) => module.default,
    )) as IsomerPageSchema

    const lastModified =
      // @ts-expect-error to fix when types are proper
      getSitemapXml(sitemap).find(
        ({ url }) => permalink.join("/") === url.replace(/^\//, ""),
      )?.lastModified || new Date().toISOString()

    schema.page.permalink = "/" + joinedPermalink
    schema.page.lastModified = lastModified

    return schema
  }

  const schema = (await import(`@/schema/index.json`).then(
    (module) => module.default,
  )) as IsomerPageSchema

  const lastModified =
    // @ts-expect-error to fix when types are proper
    getSitemapXml(sitemap).find(({ url }) => url === "/")?.lastModified ||
    new Date().toISOString()

  schema.page.permalink = "/"
  schema.page.lastModified = lastModified

  return schema
}

export const generateStaticParams = () => {
  // @ts-expect-error to fix when types are proper
  return getSitemapXml(sitemap).map(({ url }) => ({
    permalink: url.replace(/^\//, "").split("/"),
  }))
}

export const generateMetadata = async ({
  params,
}: DynamicPageProps): Promise<Metadata> => {
  const { permalink } = params
  const schema = await getSchema(permalink)
  schema.site = {
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
    // @ts-expect-error to fix when types are proper
    siteMap: sitemap,
    navBarItems: navbar,
    // @ts-expect-error to fix when types are proper
    footerItems: footer,
    lastUpdated,
  }
  return getMetadata(schema)
}

const Page = async ({ params }: DynamicPageProps) => {
  const { permalink } = params
  const renderSchema = await getSchema(permalink)

  return (
    <>
      <RenderEngine
        version={renderSchema.version}
        site={{
          ...config.site,
          environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          // @ts-expect-error to fix when types are proper
          siteMap: sitemap,
          navBarItems: navbar,
          // @ts-expect-error to fix when types are proper
          footerItems: footer,
          lastUpdated,
        }}
        layout={renderSchema.layout}
        page={renderSchema.page}
        content={renderSchema.content}
        LinkComponent={Link}
      />
    </>
  )
}

export default Page
