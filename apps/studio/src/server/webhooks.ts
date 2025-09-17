import type { CreateNextContextOptions } from "@trpc/server/dist/adapters/next.cjs"
import type { NextApiRequest, NextApiResponse } from "next"

import type { Context } from "~/server/context"
import { createGrowthBookContext } from "~/server/context"
import { db } from "~/server/modules/database"
import { webhookRouter } from "~/server/modules/webhook/webhook.router"
import { prisma } from "~/server/prisma"

/**
 * Creates the context for webhook handlers, based on the standard tRPC context, so that the request
 * can be formally handled by tRPC procedures
 * @param opts
 * @returns
 */
const createWebhookContext = async (
  opts: CreateNextContextOptions,
): Promise<Context> => {
  return {
    db,
    prisma,
    req: opts.req,
    res: opts.res,
    gb: await createGrowthBookContext(),
    session: undefined, // no session since api key auth
  }
}

/**
 * A mock TRPCRequestInfo object to satisfy the tRPC caller creation
 * This is not used in the actual request handling, but is required by the type system
 */
const createTRPCRequestInfo: CreateNextContextOptions["info"] = {
  accept: null,
  type: "mutation",
  isBatchCall: false,
  calls: [],
  connectionParams: null,
  signal: new AbortController().signal,
  url: null,
}

/**
 * Handlers for different webhooks
 * Each handler receives the Next.js request and response objects, as well as the payload
 * according to the relevant schema
 */
export const webhookHandlers = {
  updateCodebuildWebhook: async (req: NextApiRequest, res: NextApiResponse) => {
    const ctx = await createWebhookContext({
      req,
      res,
      info: createTRPCRequestInfo,
    })
    return (
      webhookRouter
        .createCaller(ctx)
        // We disable the eslint rule here because the input is validated by the trpc procedure
        // so we don't want to re-validate it here
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .updateCodebuildWebhook(req.body)
    )
  },
}
