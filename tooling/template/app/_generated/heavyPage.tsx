import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { Metadata } from "next"
import {
  buildMeta,
  buildSiteProps,
  getMetadata,
  getSchemaForPermalink,
} from "@/lib/pageData"
import { HeavyRenderEngine } from "@/render/heavyLayout"

/**
 * Factory for codegen'd heavy layout landings under `app/(heavy)/`.
 * `normalizedPermalink` is the path without leading/trailing slashes
 * (e.g. `"news"` or `"folder/news"`).
 */
export function makeHeavyPage(normalizedPermalink: string) {
  const permalinkSegments = normalizedPermalink.split("/").filter(Boolean)

  const generateMetadata = async (): Promise<Metadata> => {
    const schema = await getSchemaForPermalink(permalinkSegments)
    schema.site = buildSiteProps()
    return getMetadata(schema)
  }

  const Page = async () => {
    const schema = await getSchemaForPermalink(permalinkSegments)

    const pageProps = {
      ...schema,
      site: buildSiteProps(),
      meta: {
        ...schema.meta,
        ...buildMeta(),
      },
    } as IsomerPageSchemaType

    return <HeavyRenderEngine {...pageProps} />
  }

  return { Page, generateMetadata }
}
