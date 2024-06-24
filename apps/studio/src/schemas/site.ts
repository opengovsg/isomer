import { z } from 'zod'

export const getConfigSchema = z.object({
  id: z.string(),
})
