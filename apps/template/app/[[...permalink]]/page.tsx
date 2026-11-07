import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { Metadata, ResolvingMetadata } from "next"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import navbar from "@/data/navbar.json"
import sitemap from "@/sitemap.json"
import {
  getMetadata,
  getPageJsonLd,
  getSitemapXml,
  RenderEngine,
  shouldBlockIndexing,
} from "@opengovsg/isomer-components"
import { notFound } from "next/navigation"
import { existsSync, readFileSync } from "node:fs"
import { join, relative, sep } from "node:path"

import { serializeForInlineScript } from "@isomer/validators"

export const dynamic = "force-static"

const INDEX_PAGE_PERMALINK = "_index"
const schemaDir = join(process.cwd(), "schema")

// Folder index pages live at `schema/<permalink>/_index.json`. A dynamic
// `import(\`@/schema/${permalink}/_index.json\`)` makes Turbopack fail the
// production build when nothing matches that shape, and a permalink can
// contain slashes. Read the file instead. `next build` runs with cwd at
// apps/template, which is also where the publisher invokes `build:template`.
const readFolderIndexSchema = (
  joinedPermalink: string,
): IsomerPageSchemaType => {
  const file = join(schemaDir, joinedPermalink, `${INDEX_PAGE_PERMALINK}.json`)
  const rel = relative(schemaDir, file)
  if (rel === ".." || rel.startsWith(`..${sep}`) || rel.startsWith("/")) {
    throw new Error(
      `Schema path escapes the schema directory: ${joinedPermalink}`,
    )
  }
  if (!existsSync(file)) {
    const error = new Error(`Cannot find module '${file}'`)
    Object.assign(error, { code: "MODULE_NOT_FOUND" })
    throw error
  }
  return JSON.parse(readFileSync(file, "utf8")) as IsomerPageSchemaType
}

const isModuleNotFoundError = (error: unknown) =>
  error instanceof Error &&
  "code" in error &&
  ["MODULE_NOT_FOUND", "ERR_MODULE_NOT_FOUND"].includes(error.code as string)

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
  // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    .then((module) => module.default)
    // NOTE: If the initial import is missing, this might be a folder index
    // page whose file is `schema/<permalink>/_index.json`.
    .catch(async (error: unknown) => {
      if (!isModuleNotFoundError(error)) throw error

      if (joinedPermalink === "") {
        // oxlint-disable-next-line @typescript-eslint/no-unsafe-return
        return import(`@/schema/${INDEX_PAGE_PERMALINK}.json`).then(
          // oxlint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          (module) => module.default,
        )
      }
      return readFolderIndexSchema(joinedPermalink)
    })
    .catch((error: unknown) => {
      if (isModuleNotFoundError(error)) notFound()
      throw error
    })) as IsomerPageSchemaType

  const lastModified =
    // TODO: fixup all the typing errors
    // @ts-expect-error to fix when types are proper
    getSitemapXml(sitemap).find(
      ({ url }) =>
        joinedPermalink === url.replace(/^\//, "").replace(/\/$/, ""),
    ).lastModified || new Date().toISOString()

  schema.page.permalink = "/" + joinedPermalink
  schema.page.lastModified = lastModified

  return schema
}

export const generateStaticParams = () => {
  // TODO: fixup all the typing errors
  // @ts-expect-error to fix when types are proper
  return getSitemapXml(sitemap).map(({ url }) => ({
    permalink: url.replace(/^\//, "").replace(/\/$/, "").split("/"),
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
    navbar: navbar,
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
  const pageJsonLd = getPageJsonLd({
    ...renderSchema,
    site: {
      siteName: config.site.siteName,
      url: config.site.url,
    },
  })

  return (
    <>
      <RenderEngine
        {...renderSchema}
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
          lastUpdated,
          assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
        }}
        meta={{
          // TODO: fixup all the typing errors
          noIndex: shouldBlockIndexing(
            process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeForInlineScript(pageJsonLd),
        }}
      />
    </>
  )
}

export default Page
