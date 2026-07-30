import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { Metadata } from "next"
import type { ComponentType } from "react"
import {
  buildMeta,
  buildSiteProps,
  getMetadata,
  getSchemaForPermalink,
} from "@/lib/pageData"

/**
 * Shared factory for codegen'd heavy layout landings under `app/(heavy)/`.
 * Each layout passes its own RenderEngine so Collection / Search / Database
 * stay in separate client module graphs.
 */
export function makeLayoutPage(
  normalizedPermalink: string,
  RenderEngine: ComponentType<IsomerPageSchemaType>,
) {
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

    return <RenderEngine {...pageProps} />
  }

  return { Page, generateMetadata }
}
