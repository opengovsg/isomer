/**
 * Instantiates a single instance PrismaClient and save it on the global object.
 * @link https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "~prisma/generated/prisma/client"
import { env } from "~/env.mjs"

const prismaGlobal = global as typeof global & {
  prisma?: PrismaClient
}

export const prisma: PrismaClient =
  prismaGlobal.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (env.NODE_ENV !== "production") {
  prismaGlobal.prisma = prisma
}
