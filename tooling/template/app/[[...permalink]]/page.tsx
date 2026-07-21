import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { Metadata, ResolvingMetadata } from "next"
import { excludeHeavyFromCatchAllUrls } from "@/lib/heavyLayouts"
import {
  buildMeta,
  buildSiteProps,
  getMetadata,
  getSchemaForPermalink,
  getSitemapXml,
  sitemap,
} from "@/lib/pageData"
import { LightRenderEngine } from "@/render/lightLayout"

export const dynamic = "force-static"

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

export const generateStaticParams = () => {
  // TODO: fixup all the typing errors
  // @ts-expect-error to fix when types are proper
  const urls = getSitemapXml(sitemap).map(({ url }: { url: string }) => url)

  return excludeHeavyFromCatchAllUrls(urls, sitemap).map(
    (normalized: string) => ({
      permalink: normalized === "" ? [""] : normalized.split("/"),
    }),
  )
}

export const generateMetadata = async (
  props: DynamicPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  const schema = await getSchemaForPermalink(await getPatchedPermalink(props))
  schema.site = buildSiteProps()
  return getMetadata(schema)
}

const Page = async (props: DynamicPageProps) => {
  const renderSchema = await getSchemaForPermalink(
    await getPatchedPermalink(props),
  )

  const pageProps = {
    ...renderSchema,
    site: buildSiteProps(),
    meta: {
      ...renderSchema.meta,
      ...buildMeta(),
    },
  } as IsomerPageSchemaType

  return <LightRenderEngine {...pageProps} />
}

export default Page
