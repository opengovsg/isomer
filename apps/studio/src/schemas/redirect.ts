import { z } from "zod"

const sourceSchema = z
  .string()
  .min(1, { message: "Source path is required" })
  .max(1999, { message: "Source path must be at most 1999 characters" })
  .refine((val) => !/[\x00-\x1f\x7f\\]/.test(val), {
    message: "Source must not contain control characters or backslashes",
  })
  .refine(
    (val) =>
      !val
        .replace(/^\/+|\/+$/g, "")
        .split("/")
        .includes(".."),
    {
      message: "Source must not contain '..' path segments",
    },
  )
  .transform((val) => (val.startsWith("/") ? val : `/${val}`))

const destinationSchema = z
  .string()
  .min(1, { message: "Destination is required" })
  .max(2000, { message: "Destination must be at most 2000 characters" })
  .refine((val) => val.startsWith("/") || val.startsWith("https://"), {
    message: "Destination must start with '/' or 'https://'",
  })

export const listRedirectsSchema = z.object({
  siteId: z.number().min(1),
  sortBy: z
    .enum(["source", "destination", "createdAt"])
    .optional()
    .default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(25),
})

export const publishRedirectsSchema = z.object({
  siteId: z.number().min(1),
  creates: z.array(
    z.object({
      source: sourceSchema,
      destination: destinationSchema,
    }),
  ),
  deletes: z.array(z.string().min(1)),
})
