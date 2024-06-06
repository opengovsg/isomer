import { z } from 'zod'

export const readFolderOrTopLevelFolder = z.object({
    // Null resourceId indicates reading of top level folder in a site.
    siteId: z.string(),
    resourceId: z.string().nullable()
})