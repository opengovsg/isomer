import { z } from "zod";

const envSchema = z
  .object({
    REDIS_HOST: z.string().nonempty("REDIS_HOST env var must be set"),
    REDIS_PORT: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 6379)),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .transform((res) => {
    return { ...res, REDIS_URL: `redis://${res.REDIS_HOST}:${res.REDIS_PORT}` };
  });

export const env = envSchema.parse(process.env);
