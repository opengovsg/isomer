import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { Metadata, ResolvingMetadata } from "next"
import { buildSiteProps, getMetadata } from "@/lib/pageData"
import { LightRenderEngine } from "@/render/lightLayout"

export const dynamic = "force-static"

const PAGE_TITLE = "404: Page not found"
const PAGE_DESCRIPTION = "The page that you are accessing does not exist"
const PAGE_SCHEMA_VERSION = "0.1.0"

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
  schema.site = buildSiteProps()
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
    <LightRenderEngine
      {...({
        version: PAGE_SCHEMA_VERSION,
        site: buildSiteProps(),
        layout: "notfound",
        meta: {
          noIndex: true,
          description: PAGE_DESCRIPTION,
        },
        page: {
          title: PAGE_TITLE,
          permalink: "/404.html",
          lastModified: new Date().toISOString(),
        },
        content: [],
      } as IsomerPageSchemaType)}
    />
  )
}

export default NotFound
