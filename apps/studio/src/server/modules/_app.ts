/**
 * This file contains the root router of your tRPC-backend
 */
import { publicProcedure, router } from '../trpc'
import { meRouter } from './me/me.router'
import { authRouter } from './auth/auth.router'
import { pageRouter } from './page/page.router'
import { folderRouter } from './folder/folder.router'

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
  me: meRouter,
  auth: authRouter,
  page: pageRouter,
  folder: folderRouter,
})

export type AppRouter = typeof appRouter
