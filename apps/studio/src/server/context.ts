import type { User } from "@isomer/db";
import type * as trpc from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { db } from "@isomer/db/instance";
import { prisma } from "@isomer/db/prisma";
import { getIronSession } from "iron-session";

import { type Session, type SessionData } from "~/lib/types/session";
import { sessionOptions } from "./modules/auth/session";

interface CreateContextOptions {
  session?: Session;
  user?: Pick<User, "id" | "name" | "email">;
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export function createContextInner(opts: CreateContextOptions) {
  return {
    session: opts.session,
    prisma,
    db,
  };
}

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getIronSession<SessionData>(
    opts.req,
    opts.res,
    sessionOptions,
  );

  const innerContext = createContextInner({
    session,
  });

  return {
    ...innerContext,
    req: opts.req,
    res: opts.res,
  };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
