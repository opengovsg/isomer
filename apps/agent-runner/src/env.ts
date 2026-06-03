import { z } from "zod"

const envSchema = z.object({
  LINEAR_AGENT_TRIGGER: z
    .enum(["true", "false"])
    .transform((v) => v === "true"),
  MAX_PAYLOAD_AGE_SECONDS: z.coerce.number().int().positive(),

  LINEAR_WEBHOOK_SECRET: z.string().min(1).optional(),
  ANTHROPIC_WEBHOOK_SECRET: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  LINEAR_API_TOKEN: z.string().min(1).optional(),
})

export type Env = z.infer<typeof envSchema>

export const parseEnv = (raw: unknown): Env => envSchema.parse(raw)
