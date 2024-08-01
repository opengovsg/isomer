/**
 * This file contains the root router of your tRPC-backend
 */
import { publicProcedure, router } from "../trpc"
import { assetRouter } from "./asset/asset.router"
import { authRouter } from "./auth/auth.router"
import { folderRouter } from "./folder/folder.router"
import { meRouter } from "./me/me.router"
import { pageRouter } from "./page/page.router"
import { resourceRouter } from "./resource/resource.router"
import { siteRouter } from "./site/site.router"

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),
  me: meRouter,
  auth: authRouter,
  asset: assetRouter,
  page: pageRouter,
  folder: folderRouter,
  site: siteRouter,
  resource: resourceRouter,
})

export type AppRouter = typeof appRouter
