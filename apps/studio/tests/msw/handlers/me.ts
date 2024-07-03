import type { User } from "@isomer/db/prisma";
import { TRPCError } from "@trpc/server";

import { mockTrpcErrorResponse, trpcMsw } from "../mockTrpc";

export const defaultUser: User = {
  id: "cljcnahpn0000xlwynuea40lv",
  email: "test@example.com",
  name: "Test User",
  phone: "12345678",
  preferredName: "test",
};

const defaultMeGetQuery = () => {
  return trpcMsw.me.get.query((_req, res, ctx) => {
    return res(ctx.status(200), ctx.data(defaultUser));
  });
};

const unauthorizedMeGetQuery = () => {
  return trpcMsw.me.get.query((_req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json(mockTrpcErrorResponse(new TRPCError({ code: "UNAUTHORIZED" }))),
    );
  });
};

export const meHandlers = {
  me: defaultMeGetQuery,
  unauthorized: unauthorizedMeGetQuery,
};
