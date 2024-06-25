import { db } from '../database'
import { type SiteConfig } from './site.types'

export const getSiteConfig = async (siteId: string) => {
  const { config, name } = await db
    .selectFrom('Site')
    .where('id', '=', siteId)
    .selectAll()
    .executeTakeFirstOrThrow()

  // TODO: add JSON parsing + validation
  // at present, this is stored at JSONB inside our db.
  const { theme, isGovernment, sitemap } = config as SiteConfig

  return {
    theme,
    isGovernment,
    sitemap,
    name,
  }
}
