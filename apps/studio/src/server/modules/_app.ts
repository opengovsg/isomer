/**
 * This file contains the root router of your tRPC-backend
 */

import { publicProcedure, router } from "../trpc"
import { assetRouter } from "./asset/asset.router"
import { auditRouter } from "./audit/audit.router"
import { authRouter } from "./auth/auth.router"
import { collectionRouter } from "./collection/collection.router"
import { folderRouter } from "./folder/folder.router"
import { gazetteRouter } from "./gazette/gazette.router"
import { meRouter } from "./me/me.router"
import { pageRouter } from "./page/page.router"
import { redirectRouter } from "./redirect/redirect.router"
import { resourceRouter } from "./resource/resource.router"
import { siteRouter } from "./site/site.router"
import { userRouter } from "./user/user.router"
import { webhookRouter } from "./webhook/webhook.router"
import { whitelistRouter } from "./whitelist/whitelist.router"

export const appRouter = router({
  asset: assetRouter,
  audit: auditRouter,
  auth: authRouter,
  collection: collectionRouter,
  folder: folderRouter,
  gazette: gazetteRouter,
  healthcheck: publicProcedure.query(() => "yay!"),
  me: meRouter,
  page: pageRouter,
  redirect: redirectRouter,
  resource: resourceRouter,
  site: siteRouter,
  user: userRouter,
  webhook: webhookRouter,
  whitelist: whitelistRouter,
})

export type AppRouter = typeof appRouter
