import { z } from "zod"

const envSchema = z.object({
  // SearchSG (destination)
  SEARCHSG_API_KEY: z.string().min(1, "SEARCHSG_API_KEY is required"),
  SEARCHSG_CLIENT_ID: z.string().min(1, "SEARCHSG_CLIENT_ID is required"),
  SEARCHSG_BASE_URL: z
    .string()
    .min(1)
    .default("https://api.services.search.gov.sg/admin"),

  // Ingestion tuning
  BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(500),
  MAX_REQUESTS_PER_SECOND: z.coerce.number().positive().default(2),
  MAX_RETRIES: z.coerce.number().int().min(0).default(5),
  DRY_RUN: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  // File paths
  DOCUMENTS_FILE: z.string().min(1).default("./data/documents.ndjson"),
  CHECKPOINT_FILE: z.string().min(1).default("./data/checkpoint.json"),
  DEADLETTER_FILE: z.string().min(1).default("./data/deadletter.ndjson"),

  // Algolia (source) - only required for `export`
  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_API_KEY: z.string().optional(),
  ALGOLIA_INDEX_NAME: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  )
  throw new Error("Invalid environment variables")
}

export const env = parsed.data
