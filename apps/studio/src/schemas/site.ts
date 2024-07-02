import { z } from 'zod'

export const getConfigSchema = z.object({
  id: z.number().min(1),
})
