import { z } from 'zod'

export const getFolderSchema = z.object({
    // Could pass a null resourceId for the root level folder?
    siteId: z.string(),
    resourceId: z.string().nullable()
})